export type ConnectionState = 'unsupported' | 'disconnected' | 'connecting' | 'connected' | 'error';
export type SynchronizationStatus = 'unknown' | 'moves-only' | 'synchronized' | 'desynchronized';

export interface CubeMove {
  notation: string;
  timestamp: number;
  source: 'mock' | 'bluetooth';
}

export interface CubeState {
  facelets: string | null;
  algorithm: string;
  moveCount: number;
  synchronization: SynchronizationStatus;
}

export type Unsubscribe = () => void;

export interface SmartCubeAdapter {
  isSupported(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getConnectionState(): ConnectionState;
  getCubeState(): CubeState | null;
  subscribeToMoves(handler: (move: CubeMove) => void): Unsubscribe;
  subscribeToState?(handler: (state: CubeState) => void): Unsubscribe;
  getBatteryLevel?(): Promise<number | null>;
  getDeviceName?(): string | null;
  getProtocolName?(): string | null;
}
