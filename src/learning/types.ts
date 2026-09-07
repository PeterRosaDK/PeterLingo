export const disciplineIds = [
  'doomsday',
  'roux',
  'cards',
  'pi',
  'music-ear',
  'elements',
  'morse',
  'flashcards',
  'phonetics',
  'python_output',
] as const;
export type DisciplineId = (typeof disciplineIds)[number];

export type LearningStage = 'teaching' | 'assisted' | 'unassisted' | 'fluent';

export interface LearningUnit {
  id: string;
  discipline: DisciplineId;
  title: string;
  stage: LearningStage;
  estimatedSeconds: number;
  isNew?: boolean;
  prerequisites?: string[];
}

export interface ProgressiveHint {
  id: string;
  label: string;
  content: string;
  revealsAnswer?: boolean;
}

export interface GeneratedExercise<
  TParameters extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  learningUnitId: string;
  discipline: DisciplineId;
  prompt: string;
  parameters: TParameters;
  hints: ProgressiveHint[];
}

export interface Attempt {
  id: string;
  learningUnitId: string;
  discipline: DisciplineId;
  exerciseId: string;
  generatedParameters: Record<string, unknown>;
  correct: boolean;
  responseTimeMs: number;
  hintsUsed: number;
  answerRevealed: boolean;
  attemptedAt: string;
  grade: SchedulerGrade;
}

export type SchedulerGrade = 'again' | 'hard' | 'good' | 'easy';

export interface AttemptEvaluation {
  correct: boolean;
  responseTimeMs: number;
  hintsUsed: number;
  totalHints: number;
  answerRevealed: boolean;
  stage: LearningStage;
  fluentThresholdMs: number;
}

export interface MasteryRecord {
  learningUnitId: string;
  discipline: DisciplineId;
  stage: LearningStage;
  strength: number;
  updatedAt: string;
}

export interface SessionRecord {
  id: string;
  startedAt: string;
  completedAt?: string;
  plannedUnitIds: string[];
  completedAttemptIds: string[];
}
