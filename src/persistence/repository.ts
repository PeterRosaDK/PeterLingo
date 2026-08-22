import type { ScheduledLearningUnit } from '../learning/fsrs/scheduler';
import type { Attempt, MasteryRecord, SessionRecord } from '../learning/types';
import type { DiagnosticResult, PeterLingoSnapshot, Settings } from './types';

export interface LearningRepository {
  load(): Promise<PeterLingoSnapshot>;
  saveAttempt(attempt: Attempt): Promise<void>;
  saveScheduledUnit(card: ScheduledLearningUnit): Promise<void>;
  saveMastery(record: MasteryRecord): Promise<void>;
  saveSession(session: SessionRecord): Promise<void>;
  saveDiagnostic(result: DiagnosticResult): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  replace(snapshot: PeterLingoSnapshot): Promise<void>;
  reset(): Promise<void>;
}
