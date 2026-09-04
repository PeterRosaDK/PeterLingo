import { describe, expect, it, vi } from 'vitest';
import type { ConnectionState, SmartCubeAdapter } from './types';

vi.mock('./WebBluetoothSmartCubeAdapter', () => ({
  WebBluetoothSmartCubeAdapter: class MockWebBluetoothSmartCubeAdapter {},
}));

import { reconnectApprovedCube } from './physicalCube';

function rememberedAdapter() {
  let connection: ConnectionState = 'disconnected';
  const connectRemembered = vi
    .fn<NonNullable<SmartCubeAdapter['connectRemembered']>>()
    .mockImplementationOnce(async () => {
      connection = 'error';
      throw new Error('Cuben sov');
    })
    .mockImplementationOnce(async () => {
      connection = 'connected';
    });
  const adapter: SmartCubeAdapter = {
    isSupported: () => true,
    connect: vi.fn(),
    connectRemembered,
    disconnect: vi.fn(),
    getConnectionState: () => connection,
    getCubeState: () => null,
    subscribeToMoves: () => () => undefined,
    getRememberedCubes: vi.fn(async () => [{ id: 'cube-1', name: 'GoCube' }]),
  };
  return { adapter, connectRemembered };
}

describe('quiet GoCube reconnection', () => {
  it('runs once normally but permits an explicit Roux retry', async () => {
    const { adapter, connectRemembered } = rememberedAdapter();

    await expect(reconnectApprovedCube(adapter)).resolves.toBe(false);
    await expect(reconnectApprovedCube(adapter)).resolves.toBe(false);
    expect(connectRemembered).toHaveBeenCalledTimes(1);

    await expect(reconnectApprovedCube(adapter, { retry: true })).resolves.toBe(true);
    expect(connectRemembered).toHaveBeenCalledTimes(2);
  });
});
