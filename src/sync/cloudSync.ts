import type { Attempt } from '../learning/types';
import type { LearningRepository } from '../persistence/repository';
import { parseAttempt } from './attemptValidation';
import { mergeCloudAttempts } from './merge';

export type SyncFailure = 'auth' | 'offline' | 'unavailable' | 'invalid-response' | 'network';

export class CloudSyncError extends Error {
  constructor(
    readonly kind: SyncFailure,
    message: string
  ) {
    super(message);
  }
}

interface SyncResponse {
  attempts: Attempt[];
}

export function cloudSyncEnabled(): boolean {
  const override = import.meta.env.VITE_CLOUD_SYNC_ENABLED;
  if (override === 'true') return true;
  if (override === 'false') return false;
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

function parseResponse(value: unknown): SyncResponse {
  if (!value || typeof value !== 'object' || !Array.isArray((value as SyncResponse).attempts)) {
    throw new CloudSyncError(
      'invalid-response',
      'Serveren sendte et ugyldigt synkroniseringssvar.'
    );
  }
  return { attempts: (value as SyncResponse).attempts.map(parseAttempt) };
}

export async function synchronizeRepository(
  repository: LearningRepository,
  request: typeof fetch = fetch
) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new CloudSyncError('offline', 'Enheden er offline. Nye forsøg er gemt lokalt.');
  }

  const outgoing = await repository.load();
  let response: Response;
  try {
    response = await request('/api/sync', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-PeterLingo-Intent': 'sync-v1',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ attempts: outgoing.attempts }),
    });
  } catch {
    throw new CloudSyncError('network', 'Cloudforbindelsen kunne ikke nås. Data er gemt lokalt.');
  }

  if (response.status === 401 || response.status === 403) {
    throw new CloudSyncError('auth', 'Cloudlogin kræves for at synkronisere.');
  }
  if (response.status === 404 || response.status === 503) {
    throw new CloudSyncError('unavailable', 'Cloudsynkronisering er endnu ikke tilgængelig her.');
  }
  if (!response.ok) {
    throw new CloudSyncError('network', `Synkronisering mislykkedes (${response.status}).`);
  }

  let decoded: unknown;
  try {
    decoded = await response.json();
  } catch {
    throw new CloudSyncError('invalid-response', 'Serverens svar kunne ikke læses.');
  }

  const remote = parseResponse(decoded);
  // Reload after the network round trip so an attempt recorded meanwhile is never lost.
  const latestLocal = await repository.load();
  const merged = mergeCloudAttempts(latestLocal, remote.attempts);
  await repository.replace(merged);
  return merged;
}
