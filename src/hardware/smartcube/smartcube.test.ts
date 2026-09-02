import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('smartcube-web-bluetooth', () => ({
  connectSmartCube: vi.fn(),
  getRegisteredProtocols: vi.fn(),
}));

import {
  connectSmartCube,
  getRegisteredProtocols,
  type SmartCubeCommand,
  type SmartCubeConnection,
  type SmartCubeEvent,
  type SmartCubeProtocol,
} from 'smartcube-web-bluetooth';
import { MockSmartCubeAdapter } from './MockSmartCubeAdapter';
import { fixedLeftFirstBlockProgress, isFixedLeftFirstBlockSolved, SOLVED_FACELETS } from './state';
import { WebBluetoothSmartCubeAdapter } from './WebBluetoothSmartCubeAdapter';

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

  it('gracefully reports unsupported browsers before requesting a device', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Firefox', maxTouchPoints: 0 });
    const adapter = new WebBluetoothSmartCubeAdapter();
    expect(adapter.isSupported()).toBe(false);
    await expect(adapter.connect()).rejects.toThrow('ikke tilgængelig');
    expect(adapter.getConnectionState()).toBe('unsupported');
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

  it('keeps re-read, local log clearing, and solved calibration separate', async () => {
    const events = new Subject<SmartCubeEvent>();
    const sendCommand = vi.fn(async (command: SmartCubeCommand) => {
      if (command.type === 'REQUEST_FACELETS') {
        events.next({ timestamp: 1, type: 'FACELETS', facelets: SOLVED_FACELETS });
      }
    });
    vi.mocked(connectSmartCube).mockResolvedValue({
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
    } satisfies SmartCubeConnection);
    vi.stubGlobal('navigator', { bluetooth: {}, userAgent: 'Chrome', maxTouchPoints: 0 });

    const adapter = new WebBluetoothSmartCubeAdapter();
    await adapter.connect();
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
    await adapter.calibrateSolvedState();
    expect(sendCommand).toHaveBeenCalledWith({ type: 'REQUEST_FACELETS' });
    expect(sendCommand).toHaveBeenCalledWith({ type: 'REQUEST_RESET' });
    expect(adapter.getCubeState()).toMatchObject({
      algorithm: '',
      moveCount: 0,
      facelets: SOLVED_FACELETS,
      synchronization: 'synchronized',
    });
  });
});
