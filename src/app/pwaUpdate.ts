interface ServiceWorkerControllerSource {
  controller: ServiceWorker | null;
  addEventListener(type: 'controllerchange', listener: EventListener): void;
  removeEventListener(type: 'controllerchange', listener: EventListener): void;
}

export function reloadWhenServiceWorkerUpdates(
  source: ServiceWorkerControllerSource,
  reload: () => void
): () => void {
  if (!source.controller) return () => undefined;
  let reloading = false;
  const handleControllerChange = () => {
    if (reloading) return;
    reloading = true;
    reload();
  };
  source.addEventListener('controllerchange', handleControllerChange);
  return () => source.removeEventListener('controllerchange', handleControllerChange);
}

export function installPwaUpdateReload(): void {
  if (!('serviceWorker' in navigator)) return;
  reloadWhenServiceWorkerUpdates(navigator.serviceWorker, () => window.location.reload());
}
