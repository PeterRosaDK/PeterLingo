import { detectPlatform, getBluetoothAPI } from '@beacio/core';
import { getInstallState, isIOSSafari } from '@beacio/core/detect';
import {
  getRegisteredProtocols,
  type SmartCubeConnection,
  type SmartCubeEvent,
  type SmartCubeProtocol,
} from 'smartcube-web-bluetooth';
import { bluetoothInitializationComplete } from './initializeBluetooth';
import { appendMove } from './state';
import type {
  BluetoothDiagnostics,
  ConnectionState,
  CubeMove,
  CubeOrientation,
  CubeState,
  RememberedCube,
  SmartCubeAdapter,
  Unsubscribe,
} from './types';

const BEACIO_VERSION = '2.1.1';
const FACELET_TIMEOUT_MS = 8_000;

function isGoCubeName(name: string): boolean {
  return name.startsWith('GoCube') || name.startsWith('Rubiks');
}

function getGoCubeProtocol(): SmartCubeProtocol {
  const protocol = (getRegisteredProtocols() ?? []).find((candidate) =>
    candidate.nameFilters.some(
      (filter) => 'namePrefix' in filter && isGoCubeName(filter.namePrefix)
    )
  );
  if (!protocol) throw new Error('GoCube-protokollen blev ikke indlæst. Genindlæs PeterLingo.');
  return protocol;
}

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
  private faceletTimeout: number | null = null;

  isSupported(): boolean {
    const bluetooth = getBluetoothAPI();
    return (
      bluetoothInitializationComplete &&
      bluetooth !== null &&
      typeof bluetooth.requestDevice === 'function'
    );
  }

  async connect(onStatus?: (message: string) => void): Promise<void> {
    if (!this.isSupported()) {
      this.connectionState = 'unsupported';
      throw new Error('Web Bluetooth er ikke tilgængelig i denne browser.');
    }
    this.connectionState = 'connecting';
    this.notifyState();
    try {
      const bluetooth = this.getBluetooth();
      if (!bluetooth) throw new Error('Bluetooth-API’et er ikke klar i denne browser.');
      const protocol = getGoCubeProtocol();
      const filters = protocol.nameFilters.map((filter) => ({
        ...filter,
      })) as BluetoothLEScanFilter[];
      onStatus?.('Select your cube…');
      // Keep this request as the first awaited browser operation. On iPad it must
      // remain in the synchronous call chain of the user's tap.
      const device = await bluetooth.requestDevice({
        filters,
        optionalServices: [...protocol.optionalServices],
      });
      if (!protocol.matchesDevice(device)) {
        device.gatt?.disconnect();
        throw new Error('Den valgte Bluetooth-enhed er ikke en understøttet GoCube.');
      }
      onStatus?.('Connecting…');
      const connection = await protocol.connect(device, undefined, {
        serviceUuids: new Set(protocol.optionalServices.map(String)),
        onStatus,
      });
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
    if (!this.canReconnectRemembered()) return null;
    const bluetooth = this.getBluetooth();
    if (!bluetooth || typeof bluetooth.getDevices !== 'function') return null;
    const devices = await bluetooth.getDevices();
    return devices
      .filter((device) => {
        const name = device.name ?? '';
        return isGoCubeName(name);
      })
      .map((device) => ({ id: device.id, name: device.name ?? 'GoCube' }));
  }

  async getBluetoothAvailability(): Promise<boolean | null> {
    const bluetooth = this.getBluetooth();
    if (!bluetooth || typeof bluetooth.getAvailability !== 'function') return null;
    return bluetooth.getAvailability();
  }

  private getBluetooth(): Bluetooth | null {
    if (!getBluetoothAPI()) return null;
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
      ? navigator.bluetooth
      : null;
  }

  canReconnectRemembered(): boolean {
    const bluetooth = this.getBluetooth();
    return detectPlatform() === 'native' && typeof bluetooth?.getDevices === 'function';
  }

  getBluetoothDiagnostics(): BluetoothDiagnostics {
    const platform = detectPlatform();
    const bluetooth = this.getBluetooth();
    const protocol = (getRegisteredProtocols() ?? []).find((candidate) =>
      candidate.nameFilters.some(
        (filter) => 'namePrefix' in filter && isGoCubeName(filter.namePrefix)
      )
    );
    return {
      api:
        platform === 'safari-extension' ? 'beacio' : platform === 'native' ? 'native' : 'missing',
      extension: platform === 'native' || !isIOSSafari() ? 'not-needed' : getInstallState(),
      requestDevice: typeof bluetooth?.requestDevice === 'function',
      getDevices: typeof bluetooth?.getDevices === 'function',
      rememberedReconnect: this.canReconnectRemembered(),
      filters:
        protocol?.nameFilters.flatMap((filter) =>
          'namePrefix' in filter ? [`navn begynder med “${filter.namePrefix}”`] : []
        ) ?? [],
      libraryVersion: BEACIO_VERSION,
    };
  }

  private activateConnection(connection: SmartCubeConnection): void {
    this.subscription?.unsubscribe();
    this.connection = connection;
    this.orientation = null;
    this.subscription = connection.events$.subscribe((event) => this.onEvent(event));
    this.connectionState = 'connected';
    this.state = { ...this.state, facelets: null, synchronization: 'unknown' };
    this.notifyState();
    if (connection.capabilities.facelets) {
      this.startFaceletTimeout();
      void connection.sendCommand({ type: 'REQUEST_FACELETS' });
    }
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
      this.clearFaceletTimeout();
      this.state = { ...this.state, facelets: event.facelets, synchronization: 'synchronized' };
    } else if (event.type === 'GYRO') {
      this.orientation = { quaternion: { ...event.quaternion }, timestamp: event.timestamp };
      for (const handler of this.orientationHandlers) handler(this.getOrientation()!);
      return;
    } else if (event.type === 'BATTERY') {
      this.battery = event.batteryLevel;
    } else if (event.type === 'DISCONNECT') {
      this.clearFaceletTimeout();
      this.connectionState = 'disconnected';
    }
    for (const handler of this.stateHandlers) handler(this.getCubeState());
  }

  async disconnect(): Promise<void> {
    this.clearFaceletTimeout();
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
    this.startFaceletTimeout();
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let timeout = 0;
      let subscription: { unsubscribe(): void } | null = null;
      const finish = (error?: unknown) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        subscription?.unsubscribe();
        if (error) reject(error);
        else resolve();
      };
      subscription = connection.events$.subscribe((event) => {
        if (event.type === 'FACELETS') finish();
        else if (event.type === 'DISCONNECT') {
          finish(new Error('GoCube mistede forbindelsen, før farverne blev modtaget.'));
        }
      });
      timeout = window.setTimeout(
        () =>
          finish(
            new Error(
              'Bluetooth er forbundet, men GoCube sendte ingen gyldig farvetilstand. Væk cuben, og prøv igen.'
            )
          ),
        FACELET_TIMEOUT_MS
      );
      void connection.sendCommand({ type: 'REQUEST_FACELETS' }).catch(finish);
    });
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

  private startFaceletTimeout(): void {
    this.clearFaceletTimeout();
    this.faceletTimeout = window.setTimeout(() => {
      this.faceletTimeout = null;
      if (this.connectionState !== 'connected' || this.state.synchronization === 'synchronized') {
        return;
      }
      this.state = { ...this.state, facelets: null, synchronization: 'desynchronized' };
      this.notifyState();
    }, FACELET_TIMEOUT_MS);
  }

  private clearFaceletTimeout(): void {
    if (this.faceletTimeout === null) return;
    window.clearTimeout(this.faceletTimeout);
    this.faceletTimeout = null;
  }
}
