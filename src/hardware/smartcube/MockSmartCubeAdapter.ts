import { appendMove, SOLVED_FACELETS } from './state';
import type { ConnectionState, CubeMove, CubeState, SmartCubeAdapter, Unsubscribe } from './types';

export class MockSmartCubeAdapter implements SmartCubeAdapter {
  private connectionState: ConnectionState = 'disconnected';
  private state: CubeState = {
    facelets: SOLVED_FACELETS,
    algorithm: '',
    moveCount: 0,
    synchronization: 'synchronized',
  };
  private handlers = new Set<(move: CubeMove) => void>();
  private stateHandlers = new Set<(state: CubeState) => void>();

  isSupported(): boolean {
    return true;
  }

  async connect(): Promise<void> {
    this.connectionState = 'connected';
  }

  async disconnect(): Promise<void> {
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

  async getBatteryLevel(): Promise<number> {
    return 82;
  }

  getDeviceName(): string {
    return 'PeterLingo Mock Cube';
  }

  getProtocolName(): string {
    return 'mock';
  }

  emitMove(notation: string, timestamp = Date.now()): void {
    if (this.connectionState !== 'connected') throw new Error('Mock-terningen er ikke forbundet.');
    const move: CubeMove = { notation, timestamp, source: 'mock' };
    this.state = appendMove({ ...this.state, facelets: null }, move);
    for (const handler of this.handlers) handler(move);
    for (const handler of this.stateHandlers) handler(this.getCubeState());
  }

  reset(): void {
    this.state = {
      facelets: SOLVED_FACELETS,
      algorithm: '',
      moveCount: 0,
      synchronization: 'synchronized',
    };
    for (const handler of this.stateHandlers) handler(this.getCubeState());
  }
}
