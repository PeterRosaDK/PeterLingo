export type ConnectionState = 'unsupported' | 'disconnected' | 'connecting' | 'connected' | 'error';
export type SynchronizationStatus = 'unknown' | 'moves-only' | 'synchronized' | 'desynchronized';

export interface CubeMove {
  notation: string;
  timestamp: number;
  source: 'mock' | 'bluetooth';
}

export interface CubeOrientation {
  quaternion: { x: number; y: number; z: number; w: number };
  timestamp: number;
}

export interface CubeState {
  facelets: string | null;
  algorithm: string;
  moveCount: number;
  synchronization: SynchronizationStatus;
}

export type Unsubscribe = () => void;

export interface RememberedCube {
  id: string;
  name: string;
}

export interface BluetoothDiagnostics {
  api: 'beacio' | 'native' | 'missing';
  extension: 'active' | 'installed-inactive' | 'not-installed' | 'not-needed';
  requestDevice: boolean;
  getDevices: boolean;
  rememberedReconnect: boolean;
  filters: string[];
  libraryVersion: string;
}

export interface SmartCubeAdapter {
  isSupported(): boolean;
  connect(onStatus?: (message: string) => void): Promise<void>;
  connectRemembered?(deviceId: string, onStatus?: (message: string) => void): Promise<void>;
  disconnect(): Promise<void>;
  getConnectionState(): ConnectionState;
  getCubeState(): CubeState | null;
  subscribeToMoves(handler: (move: CubeMove) => void): Unsubscribe;
  subscribeToState?(handler: (state: CubeState) => void): Unsubscribe;
  getOrientation?(): CubeOrientation | null;
  subscribeToOrientation?(handler: (orientation: CubeOrientation) => void): Unsubscribe;
  requestState?(): Promise<void>;
  clearTracking?(): void;
  getBatteryLevel?(): Promise<number | null>;
  getDeviceName?(): string | null;
  getProtocolName?(): string | null;
  getRememberedCubes?(): Promise<RememberedCube[] | null>;
  getBluetoothAvailability?(): Promise<boolean | null>;
  canReconnectRemembered?(): boolean;
  getBluetoothDiagnostics?(): BluetoothDiagnostics;
}
