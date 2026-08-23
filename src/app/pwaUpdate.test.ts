import { describe, expect, it, vi } from 'vitest';
import { reloadWhenServiceWorkerUpdates } from './pwaUpdate';

class FakeServiceWorkerController extends EventTarget {
  constructor(readonly controller: ServiceWorker | null) {
    super();
  }
}

describe('PWA update reload', () => {
  it('reloads once when a replacement service worker takes control', () => {
    const source = new FakeServiceWorkerController({} as ServiceWorker);
    const reload = vi.fn();
    reloadWhenServiceWorkerUpdates(source, reload);

    source.dispatchEvent(new Event('controllerchange'));
    source.dispatchEvent(new Event('controllerchange'));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload during the first service-worker installation', () => {
    const source = new FakeServiceWorkerController(null);
    const reload = vi.fn();
    reloadWhenServiceWorkerUpdates(source, reload);

    source.dispatchEvent(new Event('controllerchange'));

    expect(reload).not.toHaveBeenCalled();
  });
});
