import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ScheduledLearningUnit } from '../learning/fsrs/scheduler';
import type { Attempt, MasteryRecord, SessionRecord } from '../learning/types';
import type { LearningRepository } from './repository';
import { parseSnapshot } from './validation';
import {
  createEmptySnapshot,
  type DiagnosticResult,
  type PeterLingoSnapshot,
  type Settings,
} from './types';

interface PeterLingoDb extends DBSchema {
  state: {
    key: 'current';
    value: PeterLingoSnapshot;
  };
}

type Mutator = (snapshot: PeterLingoSnapshot) => void;

export class IndexedDbLearningRepository implements LearningRepository {
  private dbPromise: Promise<IDBPDatabase<PeterLingoDb>>;

  constructor(name = 'peterlingo') {
    this.dbPromise = openDB<PeterLingoDb>(name, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
      },
    });
  }

  async load(): Promise<PeterLingoSnapshot> {
    const db = await this.dbPromise;
    return (await db.get('state', 'current')) ?? createEmptySnapshot();
  }

  private async mutate(mutator: Mutator): Promise<void> {
    const db = await this.dbPromise;
    const transaction = db.transaction('state', 'readwrite');
    const current = (await transaction.store.get('current')) ?? createEmptySnapshot();
    mutator(current);
    await transaction.store.put(current, 'current');
    await transaction.done;
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    await this.mutate((state) => state.attempts.push(attempt));
  }

  async saveScheduledUnit(card: ScheduledLearningUnit): Promise<void> {
    await this.mutate((state) => {
      state.scheduledUnits = state.scheduledUnits.filter(
        (item) => item.learningUnitId !== card.learningUnitId
      );
      state.scheduledUnits.push(card);
    });
  }

  async saveMastery(record: MasteryRecord): Promise<void> {
    await this.mutate((state) => {
      state.mastery = state.mastery.filter((item) => item.learningUnitId !== record.learningUnitId);
      state.mastery.push(record);
    });
  }

  async saveSession(session: SessionRecord): Promise<void> {
    await this.mutate((state) => {
      state.sessions = state.sessions.filter((item) => item.id !== session.id);
      state.sessions.push(session);
    });
  }

  async saveDiagnostic(result: DiagnosticResult): Promise<void> {
    await this.mutate((state) => state.diagnostics.push(result));
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.mutate((state) => {
      state.settings = settings;
    });
  }

  async replace(snapshot: PeterLingoSnapshot): Promise<void> {
    const db = await this.dbPromise;
    await db.put('state', parseSnapshot(snapshot), 'current');
  }

  async reset(): Promise<void> {
    const db = await this.dbPromise;
    await db.put('state', createEmptySnapshot(), 'current');
  }
}
