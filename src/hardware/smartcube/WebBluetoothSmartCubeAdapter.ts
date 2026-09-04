import {
  connectSmartCube,
  getRegisteredProtocols,
  type SmartCubeConnection,
  type SmartCubeEvent,
} from 'smartcube-web-bluetooth';
import { appendMove, SOLVED_FACELETS } from './state';
import type {
  ConnectionState,
  CubeMove,
  CubeOrientation,
  CubeState,
  RememberedCube,
  SmartCubeAdapter,
  Unsubscribe,
} from './types';

export class WebBluetoothSmartCubeAdapter implements SmartCubeAdapter {
  private connectionState: ConnectionState = 'disconnected';
  private state: CubeState = {
    facelets: null,
    algorithm: '',
    moveCount: 0,
    synchronization: 'unknown',
  };
  private connection: SmartCubeConnection | null = null;
  private subscription: { unsubscribe(): void } | null = null;
  private handlers = new Set<(move: CubeMove) => void>();
  private stateHandlers = new Set<(state: CubeState) => void>();
  private orientationHandlers = new Set<(orientation: CubeOrientation) => void>();
  private battery: number | null = null;
  private orientation: CubeOrientation | null = null;

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(onStatus?: (message: string) => void): Promise<void> {
    if (!this.isSupported()) {
      this.connectionState = 'unsupported';
      throw new Error('Web Bluetooth er ikke tilgængelig i denne browser.');
    }
    this.connectionState = 'connecting';
    this.notifyState();
    try {
      const connection = await connectSmartCube({ onStatus });
      this.activateConnection(connection);
    } catch (error) {
      this.connectionState = 'error';
      this.notifyState();
      throw error;
    }
  }

  async connectRemembered(deviceId: string, onStatus?: (message: string) => void): Promise<void> {
    const bluetooth = this.getBluetooth();
    if (!bluetooth || typeof bluetooth.getDevices !== 'function') {
      throw new Error('Browseren kan ikke genåbne tidligere godkendte Bluetooth-enheder.');
    }
    this.connectionState = 'connecting';
    this.notifyState();
    let device: BluetoothDevice | undefined;
    try {
      onStatus?.('Henter tidligere Bluetooth-tilladelse…');
      device = (await bluetooth.getDevices()).find((candidate) => candidate.id === deviceId);
      if (!device) {
        throw new Error('Den tidligere godkendte GoCube findes ikke længere i denne browser.');
      }
      const approvedDevice = device;
      const protocol = getRegisteredProtocols().find((candidate) =>
        candidate.matchesDevice(approvedDevice)
      );
      if (!protocol) {
        throw new Error('Den huskede Bluetooth-enhed genkendes ikke som en understøttet cube.');
      }
      onStatus?.(`GoCube er husket. Forsøger at kontakte ${approvedDevice.name ?? 'enheden'}…`);
      const connection = await protocol.connect(approvedDevice, undefined, {
        serviceUuids: new Set<string>(),
        onStatus,
      });
      this.activateConnection(connection);
    } catch (error) {
      if (device?.gatt?.connected) device.gatt.disconnect();
      this.connectionState = 'error';
      this.notifyState();
      throw error;
    }
  }

  async getRememberedCubes(): Promise<RememberedCube[] | null> {
    const bluetooth = this.getBluetooth();
    if (!bluetooth || typeof bluetooth.getDevices !== 'function') return null;
    const devices = await bluetooth.getDevices();
    return devices
      .filter((device) => {
        const name = device.name ?? '';
        return name.startsWith('GoCube') || name.startsWith('Rubiks');
      })
      .map((device) => ({ id: device.id, name: device.name ?? 'GoCube' }));
  }

  async getBluetoothAvailability(): Promise<boolean | null> {
    const bluetooth = this.getBluetooth();
    if (!bluetooth || typeof bluetooth.getAvailability !== 'function') return null;
    return bluetooth.getAvailability();
  }

  private getBluetooth(): Bluetooth | null {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
      ? navigator.bluetooth
      : null;
  }

  private activateConnection(connection: SmartCubeConnection): void {
    this.subscription?.unsubscribe();
    this.connection = connection;
    this.orientation = null;
    this.subscription = connection.events$.subscribe((event) => this.onEvent(event));
    this.connectionState = 'connected';
    this.state = { ...this.state, synchronization: 'unknown' };
    this.notifyState();
    if (connection.capabilities.facelets) void connection.sendCommand({ type: 'REQUEST_FACELETS' });
    if (connection.capabilities.battery) void connection.sendCommand({ type: 'REQUEST_BATTERY' });
  }

  private onEvent(event: SmartCubeEvent): void {
    if (event.type === 'MOVE') {
      const move: CubeMove = {
        notation: event.move,
        timestamp: event.timestamp,
        source: 'bluetooth',
      };
      this.state = appendMove(this.state, move);
      for (const handler of this.handlers) handler(move);
    } else if (event.type === 'FACELETS') {
      this.state = { ...this.state, facelets: event.facelets, synchronization: 'synchronized' };
    } else if (event.type === 'GYRO') {
      this.orientation = { quaternion: { ...event.quaternion }, timestamp: event.timestamp };
      for (const handler of this.orientationHandlers) handler(this.getOrientation()!);
      return;
    } else if (event.type === 'BATTERY') {
      this.battery = event.batteryLevel;
    } else if (event.type === 'DISCONNECT') {
      this.connectionState = 'disconnected';
    }
    for (const handler of this.stateHandlers) handler(this.getCubeState());
  }

  async disconnect(): Promise<void> {
    this.subscription?.unsubscribe();
    this.subscription = null;
    await this.connection?.disconnect();
    this.connection = null;
    this.orientation = null;
    this.connectionState = 'disconnected';
    this.notifyState();
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getCubeState(): CubeState {
    return { ...this.state };
  }

  subscribeToMoves(handler: (move: CubeMove) => void): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  subscribeToState(handler: (state: CubeState) => void): Unsubscribe {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  getOrientation(): CubeOrientation | null {
    return this.orientation
      ? { ...this.orientation, quaternion: { ...this.orientation.quaternion } }
      : null;
  }

  subscribeToOrientation(handler: (orientation: CubeOrientation) => void): Unsubscribe {
    this.orientationHandlers.add(handler);
    return () => this.orientationHandlers.delete(handler);
  }

  async requestState(): Promise<void> {
    const connection = this.connection;
    if (!connection || this.connectionState !== 'connected')
      throw new Error('Forbind GoCube, før tilstanden genindlæses.');
    if (!connection.capabilities.facelets)
      throw new Error('Denne terning kan ikke rapportere sin fulde tilstand.');
    this.state = { ...this.state, synchronization: 'unknown' };
    this.notifyState();
    await connection.sendCommand({ type: 'REQUEST_FACELETS' });
  }

  clearTracking(): void {
    this.state = {
      ...this.state,
      algorithm: '',
      moveCount: 0,
      synchronization: this.state.facelets ? 'synchronized' : 'unknown',
    };
    this.notifyState();
  }

  async calibrateSolvedState(): Promise<void> {
    const connection = this.connection;
    if (!connection || this.connectionState !== 'connected')
      throw new Error('Forbind GoCube, før den kalibreres.');
    if (!connection.capabilities.reset)
      throw new Error('Denne terning understøtter ikke nulstilling af referencepunktet.');
    await connection.sendCommand({ type: 'REQUEST_RESET' });
    this.state = {
      facelets: SOLVED_FACELETS,
      algorithm: '',
      moveCount: 0,
      synchronization: 'synchronized',
    };
    this.notifyState();
  }

  private notifyState(): void {
    const state = this.getCubeState();
    for (const handler of this.stateHandlers) handler(state);
  }

  async getBatteryLevel(): Promise<number | null> {
    const connection = this.connection;
    if (!connection?.capabilities.battery) return null;
    if (this.battery !== null) return this.battery;
    return new Promise((resolve) => {
      let settled = false;
      let timeout = 0;
      let subscription: { unsubscribe(): void } | null = null;
      const finish = (value: number | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        subscription?.unsubscribe();
        resolve(value);
      };
      subscription = connection.events$.subscribe((event) => {
        if (event.type === 'BATTERY') finish(event.batteryLevel);
      });
      timeout = window.setTimeout(() => finish(this.battery), 2_000);
      void connection.sendCommand({ type: 'REQUEST_BATTERY' }).catch(() => finish(null));
    });
  }

  getDeviceName(): string | null {
    return this.connection?.deviceName ?? null;
  }

  getProtocolName(): string | null {
    return this.connection?.protocol.name ?? null;
  }
}
