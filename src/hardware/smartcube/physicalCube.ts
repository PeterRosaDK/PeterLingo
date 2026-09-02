import { WebBluetoothSmartCubeAdapter } from './WebBluetoothSmartCubeAdapter';
import type { SmartCubeAdapter } from './types';

// One adapter keeps an approved connection alive while React routes change.
export const physicalCubeAdapter: SmartCubeAdapter = new WebBluetoothSmartCubeAdapter();

let automaticReconnect: Promise<boolean> | null = null;

/**
 * Try the browser's already-approved GoCube without opening a device chooser.
 * This deliberately runs at most once per full page load. A sleeping cube or a
 * browser without getDevices() simply leaves the explicit connection flow intact.
 */
export function reconnectApprovedCube(
  adapter: SmartCubeAdapter = physicalCubeAdapter
): Promise<boolean> {
  const initialState = adapter.getConnectionState();
  if (initialState === 'connected') return Promise.resolve(true);
  if (initialState === 'connecting' || !adapter.isSupported()) return Promise.resolve(false);
  if (automaticReconnect) return automaticReconnect;

  automaticReconnect = (async () => {
    if (!adapter.getRememberedCubes || !adapter.connectRemembered) return false;
    try {
      const remembered = await adapter.getRememberedCubes();
      const cube = remembered?.[0];
      if (!cube || adapter.getConnectionState() !== 'disconnected') {
        return adapter.getConnectionState() === 'connected';
      }
      await adapter.connectRemembered(cube.id);
      return adapter.getConnectionState() === 'connected';
    } catch {
      return false;
    }
  })();

  return automaticReconnect;
}
