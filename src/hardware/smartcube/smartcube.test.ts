import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('smartcube-web-bluetooth', () => ({ connectSmartCube: vi.fn() }));

import {
  connectSmartCube,
  type SmartCubeCommand,
  type SmartCubeConnection,
  type SmartCubeEvent,
} from 'smartcube-web-bluetooth';
import { MockSmartCubeAdapter } from './MockSmartCubeAdapter';
import { isFixedLeftFirstBlockSolved, SOLVED_FACELETS } from './state';
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

  it('gracefully reports unsupported browsers before requesting a device', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Firefox', maxTouchPoints: 0 });
    const adapter = new WebBluetoothSmartCubeAdapter();
    expect(adapter.isSupported()).toBe(false);
    await expect(adapter.connect()).rejects.toThrow('ikke tilgængelig');
    expect(adapter.getConnectionState()).toBe('unsupported');
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
