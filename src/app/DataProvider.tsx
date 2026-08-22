import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { IndexedDbLearningRepository } from '../persistence/indexedDbRepository';
import type { LearningRepository } from '../persistence/repository';
import { createEmptySnapshot, type PeterLingoSnapshot } from '../persistence/types';

interface DataContextValue {
  repository: LearningRepository;
  snapshot: PeterLingoSnapshot;
  ready: boolean;
  refresh(): Promise<void>;
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

  const refresh = useCallback(async () => {
    setSnapshot(await repository.load());
    setReady(true);
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

  const value = useMemo(
    () => ({ repository, snapshot, ready, refresh }),
    [repository, snapshot, ready, refresh]
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useLearningData(): DataContextValue {
  const value = useContext(DataContext);
  if (!value) throw new Error('useLearningData must be used inside DataProvider');
  return value;
}
