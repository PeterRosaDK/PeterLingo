import type { ScheduledLearningUnit } from '../fsrs/scheduler';
import type { Attempt, LearningUnit, MasteryRecord } from '../types';

export type DailySessionReason = 'due-review' | 'new-learning' | 'weak-area';

export const dailySessionReasonLabels: Record<DailySessionReason, string> = {
  'due-review': 'Klar til repetition nu',
  'new-learning': 'Næste lille nye trin',
  'weak-area': 'Et kendt trin, der trænger til styrke',
};

export function dailySessionReason(
  unit: LearningUnit,
  scheduled: ScheduledLearningUnit[],
  mastery: MasteryRecord[],
  now = new Date()
): DailySessionReason {
  const card = scheduled.find((item) => item.learningUnitId === unit.id);
  if (card && new Date(card.due).getTime() <= now.getTime()) return 'due-review';
  if (!card && !mastery.some((item) => item.learningUnitId === unit.id)) return 'new-learning';
  return 'weak-area';
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function estimatedSecondsForUnit(unit: LearningUnit, attempts: Attempt[]): number {
  const recentSeconds = attempts
    .filter((attempt) => attempt.learningUnitId === unit.id && attempt.responseTimeMs > 0)
    .sort((left, right) => right.attemptedAt.localeCompare(left.attemptedAt))
    .slice(0, 7)
    .map((attempt) => attempt.responseTimeMs / 1000);
  if (!recentSeconds.length) return unit.estimatedSeconds;

  // Keep the catalogue estimate as an anchor and add a small allowance for feedback and navigation.
  const observed = median(recentSeconds) + 12;
  return Math.round(Math.max(20, Math.min(180, unit.estimatedSeconds * 0.6 + observed * 0.4)));
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface DailySessionProgress {
  completedUnitIds: string[];
  completedAttemptIds: string[];
  completedCount: number;
  attemptCount: number;
  correctCount: number;
  hintsUsed: number;
  complete: boolean;
}

export function dailySessionProgress(
  plan: LearningUnit[],
  attempts: Attempt[],
  day = new Date()
): DailySessionProgress {
  const dayKey = localDateKey(day);
  const plannedIds = new Set(plan.map((unit) => unit.id));
  const matching = attempts.filter(
    (attempt) =>
      plannedIds.has(attempt.learningUnitId) &&
      localDateKey(new Date(attempt.attemptedAt)) === dayKey
  );
  const attemptedUnitIds = new Set(matching.map((attempt) => attempt.learningUnitId));
  const completedUnitIds = plan
    .map((unit) => unit.id)
    .filter((learningUnitId) => attemptedUnitIds.has(learningUnitId));

  return {
    completedUnitIds,
    completedAttemptIds: matching.map((attempt) => attempt.id),
    completedCount: completedUnitIds.length,
    attemptCount: matching.length,
    correctCount: matching.filter((attempt) => attempt.correct).length,
    hintsUsed: matching.reduce((sum, attempt) => sum + attempt.hintsUsed, 0),
    complete: plan.length > 0 && completedUnitIds.length === plan.length,
  };
}
