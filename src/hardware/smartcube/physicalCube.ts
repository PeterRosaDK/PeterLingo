import { WebBluetoothSmartCubeAdapter } from './WebBluetoothSmartCubeAdapter';
import type { SmartCubeAdapter } from './types';

// One adapter keeps an approved connection alive while React routes change.
export const physicalCubeAdapter: SmartCubeAdapter = new WebBluetoothSmartCubeAdapter();

const automaticReconnects = new WeakMap<SmartCubeAdapter, Promise<boolean>>();
const attemptedAdapters = new WeakSet<SmartCubeAdapter>();

interface ReconnectOptions {
  retry?: boolean;
}

/**
 * Try the browser's already-approved GoCube without opening a device chooser.
 * The ordinary app-wide call runs once per full page load. A focused route may
 * request one more quiet attempt after the first one has finished, for example
 * when the user enters Roux after waking the cube. No device chooser is opened.
 */
export function reconnectApprovedCube(
  adapter: SmartCubeAdapter = physicalCubeAdapter,
  options: ReconnectOptions = {}
): Promise<boolean> {
  const initialState = adapter.getConnectionState();
  if (initialState === 'connected') return Promise.resolve(true);
  const inFlight = automaticReconnects.get(adapter);
  if (inFlight) return inFlight;
  if (initialState === 'connecting' || !adapter.isSupported()) return Promise.resolve(false);
  if (attemptedAdapters.has(adapter) && !options.retry) return Promise.resolve(false);
  attemptedAdapters.add(adapter);

  const attempt = (async () => {
    if (
      !adapter.getRememberedCubes ||
      !adapter.connectRemembered ||
      adapter.canReconnectRemembered?.() === false
    )
      return false;
    try {
      const remembered = await adapter.getRememberedCubes();
      const cube = remembered?.length === 1 ? remembered[0] : undefined;
      const currentState = adapter.getConnectionState();
      if (!cube || currentState === 'connecting') {
        return adapter.getConnectionState() === 'connected';
      }
      await adapter.connectRemembered(cube.id);
      return adapter.getConnectionState() === 'connected';
    } catch {
      return false;
    }
  })();

  const trackedAttempt = attempt.finally(() => {
    if (automaticReconnects.get(adapter) === trackedAttempt) {
      automaticReconnects.delete(adapter);
    }
  });
  automaticReconnects.set(adapter, trackedAttempt);
  return trackedAttempt;
}
