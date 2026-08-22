import type { ScheduledLearningUnit } from '../learning/fsrs/scheduler';
import type { Attempt, MasteryRecord, SessionRecord } from '../learning/types';
import type { LearningRepository } from './repository';
import {
  createEmptySnapshot,
  type DiagnosticResult,
  type PeterLingoSnapshot,
  type Settings,
} from './types';

export class InMemoryLearningRepository implements LearningRepository {
  private state: PeterLingoSnapshot;

  constructor(initial = createEmptySnapshot()) {
    this.state = structuredClone(initial);
  }

  async load() {
    return structuredClone(this.state);
  }
  async saveAttempt(value: Attempt) {
    this.state.attempts.push(value);
  }
  async saveScheduledUnit(value: ScheduledLearningUnit) {
    this.state.scheduledUnits = [
      ...this.state.scheduledUnits.filter((item) => item.learningUnitId !== value.learningUnitId),
      value,
    ];
  }
  async saveMastery(value: MasteryRecord) {
    this.state.mastery = [
      ...this.state.mastery.filter((item) => item.learningUnitId !== value.learningUnitId),
      value,
    ];
  }
  async saveSession(value: SessionRecord) {
    this.state.sessions = [...this.state.sessions.filter((item) => item.id !== value.id), value];
  }
  async saveDiagnostic(value: DiagnosticResult) {
    this.state.diagnostics.push(value);
  }
  async saveSettings(value: Settings) {
    this.state.settings = structuredClone(value);
  }
  async replace(value: PeterLingoSnapshot) {
    this.state = structuredClone(value);
  }
  async reset() {
    this.state = createEmptySnapshot();
  }
}
