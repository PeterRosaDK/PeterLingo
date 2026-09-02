import type { ScheduledLearningUnit } from '../learning/fsrs/scheduler';
import type { Attempt, DisciplineId, MasteryRecord, SessionRecord } from '../learning/types';

export const CURRENT_SCHEMA_VERSION = 1;

export type ThemePreference = 'system' | 'light' | 'dark';
export type NoteNaming = 'danish' | 'international';

export interface Settings {
  theme: ThemePreference;
  feedbackSounds: boolean;
  noteNaming: NoteNaming;
  showPianoNoteNames: boolean;
  targetMinutes: number;
  focusWeights: Record<DisciplineId, number>;
}

export interface DiagnosticResult {
  id: string;
  discipline: DisciplineId;
  completedAt: string;
  estimatedStage: 'teaching' | 'assisted' | 'unassisted' | 'fluent';
  scores: Record<string, number>;
}

export interface HardwarePreferences {
  preferredAdapter: 'real' | 'mock';
  lastDeviceName?: string;
}

export interface PeterLingoSnapshot {
  schemaVersion: number;
  exportedAt?: string;
  settings: Settings;
  scheduledUnits: ScheduledLearningUnit[];
  mastery: MasteryRecord[];
  attempts: Attempt[];
  sessions: SessionRecord[];
  diagnostics: DiagnosticResult[];
  hardware: HardwarePreferences;
}

export const defaultSettings: Settings = {
  theme: 'system',
  feedbackSounds: true,
  noteNaming: 'danish',
  showPianoNoteNames: true,
  targetMinutes: 7,
  focusWeights: { doomsday: 1, roux: 1, cards: 1, pi: 1, 'music-ear': 1 },
};

export function createEmptySnapshot(): PeterLingoSnapshot {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: structuredClone(defaultSettings),
    scheduledUnits: [],
    mastery: [],
    attempts: [],
    sessions: [],
    diagnostics: [],
    hardware: { preferredAdapter: 'real' },
  };
}
