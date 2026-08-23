import type { CloudSyncStatus } from './DataProvider';

export type CloudAccessAction = 'login' | 'logout' | null;

export function cloudAccessAction(
  hostname: string,
  syncStatus: CloudSyncStatus
): CloudAccessAction {
  if (hostname !== 'peterlingo.petergpt.dk') return null;
  return syncStatus === 'auth-required' ? 'login' : 'logout';
}

export async function logoutCloudAccessAndReturn(
  request: typeof fetch = fetch,
  navigate: (url: string) => void = (url) => window.location.assign(url)
): Promise<void> {
  try {
    await request('/cdn-cgi/access/logout', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    // Returning to the app is still more useful than exposing a network error page.
  } finally {
    navigate('/');
  }
}
