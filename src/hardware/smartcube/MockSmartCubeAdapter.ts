import { appendMove, SOLVED_FACELETS } from './state';
import type {
  ConnectionState,
  CubeMove,
  CubeOrientation,
  CubeState,
  SmartCubeAdapter,
  Unsubscribe,
} from './types';

export class MockSmartCubeAdapter implements SmartCubeAdapter {
  private connectionState: ConnectionState = 'disconnected';
  private state: CubeState;
  private handlers = new Set<(move: CubeMove) => void>();
  private stateHandlers = new Set<(state: CubeState) => void>();
  private orientationHandlers = new Set<(orientation: CubeOrientation) => void>();
  private orientation: CubeOrientation | null = null;

  constructor(facelets: string = SOLVED_FACELETS) {
    this.state = {
      facelets,
      algorithm: '',
      moveCount: 0,
      synchronization: 'synchronized',
    };
  }

  isSupported(): boolean {
    return true;
  }

  async connect(): Promise<void> {
    this.connectionState = 'connected';
    this.notifyState();
  }

  async disconnect(): Promise<void> {
    this.connectionState = 'disconnected';
    this.orientation = null;
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

  setOrientation(quaternion: CubeOrientation['quaternion'], timestamp = Date.now()): void {
    this.orientation = { quaternion: { ...quaternion }, timestamp };
    for (const handler of this.orientationHandlers) handler(this.getOrientation()!);
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

  async requestState(): Promise<void> {
    this.notifyState();
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
    this.reset();
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
    this.notifyState();
  }

  setFacelets(facelets: string): void {
    this.state = {
      ...this.state,
      facelets,
      synchronization: 'synchronized',
    };
    this.notifyState();
  }

  private notifyState(): void {
    const state = this.getCubeState();
    for (const handler of this.stateHandlers) handler(state);
  }
}
