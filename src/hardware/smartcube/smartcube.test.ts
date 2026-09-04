import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('smartcube-web-bluetooth', () => ({
  getRegisteredProtocols: vi.fn(),
}));

import {
  getRegisteredProtocols,
  type SmartCubeCommand,
  type SmartCubeConnection,
  type SmartCubeEvent,
  type SmartCubeProtocol,
} from 'smartcube-web-bluetooth';
import { bluetoothInitializationComplete } from './initializeBluetooth';
import { MockSmartCubeAdapter } from './MockSmartCubeAdapter';
import {
  fixedCmllProgress,
  fixedLeftFirstBlockProgress,
  fixedLseProgress,
  fixedRightSecondBlockProgress,
  isFixedCmllSolved,
  isFixedLeftFirstBlockSolved,
  isFixedLseSolved,
  isFixedRightSecondBlockSolved,
  SOLVED_FACELETS,
} from './state';
import { WebBluetoothSmartCubeAdapter } from './WebBluetoothSmartCubeAdapter';

const SECOND_BLOCK_SETUP_FACELETS = 'UURUUFBBFRRDBRRURRURDFFUFFFDDRDDDDDBFFLLLLLLLBLLUBBUBB';
const SUNE_SETUP_FACELETS = 'RUFUUUUULBBURRRRRRBFUFFFFFFDDDDDDDDDFRRLLLLLLLLUBBBBBB';
const T_PERM_SETUP_FACELETS = 'UUUUUUUUUBLFRRRRRRFFRFFFFFFDDDDDDDDDLRLLLLLLLRBBBBBBBB';
const LSE_EO_SETUP_FACELETS = 'UUUFUFURUFDFRRRRRRLULFFFFUFDLDDDDDDDBUBLLLLLLRBRBBBBBB';
const LSE_SWAP_SETUP_FACELETS = 'UUUUUDUUULFLRRRRRRBBBFFFFRFDUDDDDDDDRLRLLLLLLFFFBBBBBB';
const LSE_FINISH_SETUP_FACELETS = 'UUUUUUUUURRRRRRRRRFBFFFFFBFDDDDDDDDDLLLLLLLLLBFBBBBBFB';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('smart-cube adapters', () => {
  it('supports mock connection lifecycle and move subscriptions', async () => {
    const adapter = new MockSmartCubeAdapter();
    const moves: string[] = [];
    const unsubscribe = adapter.subscribeToMoves((move) => moves.push(move.notation));
    await adapter.connect();
    adapter.emitMove('R');
    unsubscribe();
    adapter.emitMove("U'");
    expect(moves).toEqual(['R']);
    expect(adapter.getCubeState()).toMatchObject({
      algorithm: "R U'",
      moveCount: 2,
      synchronization: 'moves-only',
    });
    await adapter.disconnect();
    expect(adapter.getConnectionState()).toBe('disconnected');
  });

  it('detects a fixed-orientation left First Block in solved state', () => {
    expect(isFixedLeftFirstBlockSolved(SOLVED_FACELETS)).toBe(true);
    expect(isFixedLeftFirstBlockSolved(`X${SOLVED_FACELETS.slice(1)}`)).toBe(true);
    expect(
      isFixedLeftFirstBlockSolved(`${SOLVED_FACELETS.slice(0, 27)}X${SOLVED_FACELETS.slice(28)}`)
    ).toBe(false);
  });

  it('reports the two First Block subgoals piece by piece', () => {
    expect(fixedLeftFirstBlockProgress('X'.repeat(54)).valid).toBe(false);
    expect(fixedLeftFirstBlockProgress(SOLVED_FACELETS)).toEqual({
      valid: true,
      solvedPieceIds: ['front-corner', 'front-edge', 'bottom-edge', 'back-corner', 'back-edge'],
      frontSquareComplete: true,
      complete: true,
    });

    const withoutBackPair = [...SOLVED_FACELETS];
    withoutBackPair[33] = 'X';
    withoutBackPair[50] = 'X';
    expect(fixedLeftFirstBlockProgress(withoutBackPair.join(''))).toMatchObject({
      solvedPieceIds: ['front-corner', 'front-edge', 'bottom-edge'],
      frontSquareComplete: true,
      complete: false,
    });
  });

  it('recognizes Second Block only while First Block remains intact', () => {
    expect(isFixedRightSecondBlockSolved(SOLVED_FACELETS)).toBe(true);
    expect(fixedRightSecondBlockProgress(SOLVED_FACELETS)).toEqual({
      valid: true,
      firstBlockComplete: true,
      solvedPieceIds: ['front-corner', 'front-edge', 'bottom-edge', 'back-corner', 'back-edge'],
      bottomEdgeComplete: true,
      frontSquareComplete: true,
      backSquareComplete: true,
      oneSquareComplete: true,
      complete: true,
    });

    const backSquareOnly = [...SOLVED_FACELETS];
    backSquareOnly[29] = 'X';
    backSquareOnly[23] = 'X';
    expect(fixedRightSecondBlockProgress(backSquareOnly.join(''))).toMatchObject({
      firstBlockComplete: true,
      solvedPieceIds: ['bottom-edge', 'back-corner', 'back-edge'],
      bottomEdgeComplete: true,
      frontSquareComplete: false,
      backSquareComplete: true,
      oneSquareComplete: true,
      complete: false,
    });

    const brokenFirstBlock = [...SOLVED_FACELETS];
    brokenFirstBlock[27] = 'X';
    expect(fixedRightSecondBlockProgress(brokenFirstBlock.join(''))).toMatchObject({
      firstBlockComplete: false,
      solvedPieceIds: ['front-corner', 'front-edge', 'bottom-edge', 'back-corner', 'back-edge'],
      complete: false,
    });

    expect(fixedRightSecondBlockProgress(SECOND_BLOCK_SETUP_FACELETS)).toMatchObject({
      valid: true,
      firstBlockComplete: true,
      solvedPieceIds: ['bottom-edge'],
      bottomEdgeComplete: true,
      oneSquareComplete: false,
      complete: false,
    });
  });

  it('tracks two-look CMLL while requiring both blocks', () => {
    expect(isFixedCmllSolved(SOLVED_FACELETS)).toBe(true);
    expect(fixedCmllProgress(SOLVED_FACELETS)).toEqual({
      valid: true,
      blocksComplete: true,
      orientedCornerCount: 4,
      orientedCornerIds: ['front-right', 'back-right', 'back-left', 'front-left'],
      cornersOriented: true,
      headlightFaces: ['F', 'R', 'B', 'L'],
      solvedCornerIds: ['front-right', 'back-right', 'back-left', 'front-left'],
      complete: true,
    });

    expect(fixedCmllProgress(SUNE_SETUP_FACELETS)).toMatchObject({
      valid: true,
      blocksComplete: true,
      orientedCornerCount: 1,
      orientedCornerIds: ['front-left'],
      cornersOriented: false,
      solvedCornerIds: [],
      complete: false,
    });
    expect(fixedCmllProgress(T_PERM_SETUP_FACELETS)).toMatchObject({
      valid: true,
      blocksComplete: true,
      orientedCornerCount: 4,
      cornersOriented: true,
      headlightFaces: ['L'],
      solvedCornerIds: ['back-left', 'front-left'],
      complete: false,
    });

    const brokenBlocks = [...SOLVED_FACELETS];
    brokenBlocks[29] = 'X';
    expect(fixedCmllProgress(brokenBlocks.join(''))).toMatchObject({
      blocksComplete: false,
      cornersOriented: true,
      solvedCornerIds: ['front-right', 'back-right', 'back-left', 'front-left'],
      complete: false,
    });
  });

  it('tracks all three beginner LSE subgoals and only completes on a solved cube', () => {
    expect(isFixedLseSolved(SOLVED_FACELETS)).toBe(true);
    expect(fixedLseProgress(SOLVED_FACELETS)).toEqual({
      valid: true,
      blocksComplete: true,
      cmllComplete: true,
      orientedEdgeCount: 6,
      edgesOriented: true,
      lrEdgesOnBottomCount: 0,
      lrEdgesRelativeCount: 2,
      lrEdgesRelative: true,
      solvedFaceCount: 6,
      complete: true,
    });

    expect(fixedLseProgress(LSE_EO_SETUP_FACELETS)).toMatchObject({
      valid: true,
      blocksComplete: true,
      cmllComplete: true,
      orientedEdgeCount: 2,
      edgesOriented: false,
      complete: false,
    });
    expect(fixedLseProgress(LSE_SWAP_SETUP_FACELETS)).toMatchObject({
      valid: true,
      blocksComplete: true,
      cmllComplete: true,
      orientedEdgeCount: 6,
      edgesOriented: true,
      lrEdgesOnBottomCount: 1,
      lrEdgesRelativeCount: 0,
      lrEdgesRelative: false,
      complete: false,
    });
    expect(fixedLseProgress(LSE_FINISH_SETUP_FACELETS)).toMatchObject({
      valid: true,
      blocksComplete: true,
      cmllComplete: true,
      orientedEdgeCount: 6,
      edgesOriented: true,
      lrEdgesRelative: true,
      complete: false,
    });

    const brokenCorner = [...LSE_EO_SETUP_FACELETS];
    brokenCorner[8] = 'X';
    expect(fixedLseProgress(brokenCorner.join(''))).toMatchObject({
      blocksComplete: true,
      cmllComplete: false,
      complete: false,
    });
  });

  it('gracefully reports unsupported browsers before requesting a device', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Firefox', maxTouchPoints: 0 });
    const adapter = new WebBluetoothSmartCubeAdapter();
    expect(adapter.isSupported()).toBe(false);
    await expect(adapter.connect()).rejects.toThrow('ikke tilgængelig');
    expect(adapter.getConnectionState()).toBe('unsupported');
  });

  it('initializes the Beacio bridge before any Bluetooth capability check', () => {
    expect(bluetoothInitializationComplete).toBe(true);
    const adapter = new WebBluetoothSmartCubeAdapter();
    expect(adapter.getBluetoothDiagnostics()).toMatchObject({
      requestDevice: false,
      rememberedReconnect: false,
    });
  });

  it('does not mistake Beacio installation stub for an active iPad Bluetooth API', () => {
    vi.stubGlobal('navigator', {
      bluetooth: { __beacioCDNStub: true, requestDevice: vi.fn() },
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      platform: 'iPad',
      maxTouchPoints: 5,
    });
    const adapter = new WebBluetoothSmartCubeAdapter();

    expect(adapter.isSupported()).toBe(false);
    expect(adapter.getBluetoothDiagnostics()).toMatchObject({
      api: 'missing',
      extension: 'not-installed',
      requestDevice: false,
      rememberedReconnect: false,
    });
  });

  it('lists and reconnects a GoCube already approved for this origin', async () => {
    const device = {
      id: 'remembered-gocube',
      name: 'GoCube_1234',
    } as BluetoothDevice;
    const events = new Subject<SmartCubeEvent>();
    const sendCommand = vi.fn(async () => undefined);
    const connection = {
      deviceName: 'GoCube',
      deviceMAC: '',
      protocol: { id: 'gocube', name: 'GoCube' },
      capabilities: {
        gyroscope: true,
        battery: true,
        facelets: true,
        hardware: true,
        reset: true,
      },
      events$: events,
      sendCommand,
      disconnect: vi.fn(async () => undefined),
    } satisfies SmartCubeConnection;
    const protocol = {
      nameFilters: [{ namePrefix: 'GoCube' }],
      optionalServices: [],
      matchesDevice: vi.fn(() => true),
      gattAffinity: vi.fn(() => 1),
      connect: vi.fn(async () => connection),
    } satisfies SmartCubeProtocol;
    vi.mocked(getRegisteredProtocols).mockReturnValue([protocol]);
    vi.stubGlobal('navigator', {
      bluetooth: {
        getDevices: vi.fn(async () => [device]),
        getAvailability: vi.fn(async () => true),
      },
      userAgent: 'Chrome',
      maxTouchPoints: 0,
    });

    const adapter = new WebBluetoothSmartCubeAdapter();
    await expect(adapter.getRememberedCubes()).resolves.toEqual([
      { id: 'remembered-gocube', name: 'GoCube_1234' },
    ]);
    await expect(adapter.getBluetoothAvailability()).resolves.toBe(true);
    await adapter.connectRemembered('remembered-gocube');

    expect(protocol.connect).toHaveBeenCalledWith(
      device,
      undefined,
      expect.objectContaining({ serviceUuids: expect.any(Set) })
    );
    expect(adapter.getConnectionState()).toBe('connected');
    expect(sendCommand).toHaveBeenCalledWith({ type: 'REQUEST_FACELETS' });
  });

  it('keeps fresh-state requests separate from local move-log clearing', async () => {
    const events = new Subject<SmartCubeEvent>();
    const sendCommand = vi.fn(async (command: SmartCubeCommand) => {
      if (command.type === 'REQUEST_FACELETS') {
        events.next({ timestamp: 1, type: 'FACELETS', facelets: SOLVED_FACELETS });
      }
    });
    const connection = {
      deviceName: 'GoCube',
      deviceMAC: '',
      protocol: { id: 'gocube', name: 'GoCube' },
      capabilities: {
        gyroscope: true,
        battery: true,
        facelets: true,
        hardware: true,
        reset: true,
      },
      events$: events,
      sendCommand,
      disconnect: vi.fn(async () => undefined),
    } satisfies SmartCubeConnection;
    const protocol = {
      nameFilters: [{ namePrefix: 'GoCube_' }, { namePrefix: 'GoCube' }, { namePrefix: 'Rubiks' }],
      optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'],
      matchesDevice: vi.fn(() => true),
      gattAffinity: vi.fn(() => 1),
      connect: vi.fn(async () => connection),
    } satisfies SmartCubeProtocol;
    vi.mocked(getRegisteredProtocols).mockReturnValue([protocol]);
    const device = { id: 'new-gocube', name: 'GoCube_1234' } as BluetoothDevice;
    const requestDevice = vi.fn(async () => device);
    vi.stubGlobal('navigator', {
      bluetooth: { requestDevice },
      userAgent: 'Chrome',
      maxTouchPoints: 0,
    });

    const adapter = new WebBluetoothSmartCubeAdapter();
    const connecting = adapter.connect();
    expect(requestDevice).toHaveBeenCalledWith({
      filters: [{ namePrefix: 'GoCube_' }, { namePrefix: 'GoCube' }, { namePrefix: 'Rubiks' }],
      optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'],
    });
    await connecting;
    const orientations: Array<{ x: number; y: number; z: number; w: number }> = [];
    adapter.subscribeToOrientation((orientation) => orientations.push(orientation.quaternion));
    events.next({
      timestamp: 1.5,
      type: 'GYRO',
      quaternion: { x: 0.1, y: 0.2, z: 0.3, w: 0.9 },
    });
    expect(adapter.getOrientation()).toMatchObject({
      quaternion: { x: 0.1, y: 0.2, z: 0.3, w: 0.9 },
      timestamp: 1.5,
    });
    expect(orientations).toEqual([{ x: 0.1, y: 0.2, z: 0.3, w: 0.9 }]);
    events.next({
      timestamp: 2,
      type: 'MOVE',
      face: 1,
      direction: 0,
      move: 'R',
      localTimestamp: 2,
      cubeTimestamp: null,
    });
    expect(adapter.getCubeState()).toMatchObject({ algorithm: 'R', moveCount: 1 });

    adapter.clearTracking();
    expect(adapter.getCubeState()).toMatchObject({
      algorithm: '',
      moveCount: 0,
      facelets: SOLVED_FACELETS,
    });

    await adapter.requestState();
    expect(sendCommand).toHaveBeenCalledWith({ type: 'REQUEST_FACELETS' });
    expect(sendCommand).not.toHaveBeenCalledWith({ type: 'REQUEST_RESET' });
    expect(adapter.getCubeState()).toMatchObject({
      algorithm: '',
      moveCount: 0,
      facelets: SOLVED_FACELETS,
      synchronization: 'synchronized',
    });

    await adapter.disconnect();
    expect(adapter.getOrientation()).toBeNull();
  });
});
