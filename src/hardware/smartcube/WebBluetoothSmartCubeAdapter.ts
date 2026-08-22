import {
  connectSmartCube,
  type SmartCubeConnection,
  type SmartCubeEvent,
} from 'smartcube-web-bluetooth';
import { appendMove } from './state';
import type { ConnectionState, CubeMove, CubeState, SmartCubeAdapter, Unsubscribe } from './types';

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
  private battery: number | null = null;

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<void> {
    if (!this.isSupported()) {
      this.connectionState = 'unsupported';
      throw new Error('Web Bluetooth er ikke tilgængelig i denne browser.');
    }
    this.connectionState = 'connecting';
    try {
      this.connection = await connectSmartCube({ onStatus: () => undefined });
      this.subscription = this.connection.events$.subscribe((event) => this.onEvent(event));
      this.connectionState = 'connected';
      if (this.connection.capabilities.facelets)
        void this.connection.sendCommand({ type: 'REQUEST_FACELETS' });
      if (this.connection.capabilities.battery)
        void this.connection.sendCommand({ type: 'REQUEST_BATTERY' });
    } catch (error) {
      this.connectionState = 'error';
      throw error;
    }
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
    this.connectionState = 'disconnected';
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
