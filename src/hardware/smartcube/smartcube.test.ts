import { describe, expect, it, vi } from 'vitest';

vi.mock('smartcube-web-bluetooth', () => ({ connectSmartCube: vi.fn() }));

import { MockSmartCubeAdapter } from './MockSmartCubeAdapter';
import { isFixedLeftFirstBlockSolved, SOLVED_FACELETS } from './state';
import { WebBluetoothSmartCubeAdapter } from './WebBluetoothSmartCubeAdapter';

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
    vi.unstubAllGlobals();
  });
});
