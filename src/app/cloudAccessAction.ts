import type { CloudSyncStatus } from './DataProvider';

export type CloudAccessAction = 'login' | 'logout' | null;

export function cloudAccessAction(
  hostname: string,
  syncStatus: CloudSyncStatus
): CloudAccessAction {
  if (hostname !== 'peterlingo.petergpt.dk') return null;
  return syncStatus === 'auth-required' ? 'login' : 'logout';
}
