import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { IndexedDbLearningRepository } from '../persistence/indexedDbRepository';
import type { LearningRepository } from '../persistence/repository';
import { createEmptySnapshot, type PeterLingoSnapshot } from '../persistence/types';
import { CloudSyncError, cloudSyncEnabled, synchronizeRepository } from '../sync/cloudSync';

export type CloudSyncStatus =
  | 'local'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'auth-required'
  | 'unavailable'
  | 'error';

interface DataContextValue {
  repository: LearningRepository;
  snapshot: PeterLingoSnapshot;
  ready: boolean;
  syncStatus: CloudSyncStatus;
  refresh(): Promise<void>;
  syncNow(): Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);
const browserRepository = new IndexedDbLearningRepository();

export function DataProvider({
  children,
  repository = browserRepository,
}: {
  children: ReactNode;
  repository?: LearningRepository;
}) {
  const [snapshot, setSnapshot] = useState(createEmptySnapshot);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('local');
  const syncPromise = useRef<Promise<void> | null>(null);
  const rerunRequested = useRef(false);

  const refresh = useCallback(async () => {
    setSnapshot(await repository.load());
    setReady(true);
  }, [repository]);

  const syncNow = useCallback(async () => {
    if (!cloudSyncEnabled()) {
      setSyncStatus('local');
      return;
    }
    if (syncPromise.current) {
      rerunRequested.current = true;
      return syncPromise.current;
    }

    setSyncStatus('syncing');
    const operation = synchronizeRepository(repository)
      .then((merged) => {
        setSnapshot(merged);
        setSyncStatus('synced');
      })
      .catch((error: unknown) => {
        if (error instanceof CloudSyncError) {
          setSyncStatus(
            error.kind === 'auth'
              ? 'auth-required'
              : error.kind === 'offline'
                ? 'offline'
                : error.kind === 'unavailable'
                  ? 'unavailable'
                  : 'error'
          );
          return;
        }
        setSyncStatus('error');
      });
    syncPromise.current = operation;

    try {
      await operation;
    } finally {
      syncPromise.current = null;
      if (rerunRequested.current) {
        rerunRequested.current = false;
        queueMicrotask(() => void syncNow());
      }
    }
  }, [repository]);

  useEffect(() => {
    let active = true;
    void repository.load().then((loaded) => {
      if (!active) return;
      setSnapshot(loaded);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [repository]);

  useEffect(() => {
    if (!ready) return;
    void syncNow();
  }, [ready, syncNow]);

  useEffect(() => {
    const handleOnline = () => void syncNow();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncNow]);

  const value = useMemo(
    () => ({ repository, snapshot, ready, syncStatus, refresh, syncNow }),
    [repository, snapshot, ready, syncStatus, refresh, syncNow]
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useLearningData(): DataContextValue {
  const value = useContext(DataContext);
  if (!value) throw new Error('useLearningData must be used inside DataProvider');
  return value;
}
