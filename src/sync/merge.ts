import { FsrsScheduler } from '../learning/fsrs/scheduler';
import type { Attempt, LearningStage, MasteryRecord } from '../learning/types';
import type { PeterLingoSnapshot } from '../persistence/types';
import { isLearningStage, parseAttempt } from './attemptValidation';

const scheduler = new FsrsScheduler();

function compareAttempts(left: Attempt, right: Attempt): number {
  return left.attemptedAt.localeCompare(right.attemptedAt) || left.id.localeCompare(right.id);
}

function stageFor(attempt: Attempt): LearningStage {
  const recorded = attempt.generatedParameters.learningStage;
  if (attempt.correct && attempt.hintsUsed === 0 && !attempt.answerRevealed) return 'unassisted';
  return isLearningStage(recorded) ? recorded : 'assisted';
}

function strengthFor(attempt: Attempt): number {
  if (attempt.grade === 'easy') return 0.9;
  if (attempt.grade === 'good') return 0.68;
  if (attempt.grade === 'hard') return 0.42;
  return 0.18;
}

export function mergeAttempts(local: Attempt[], remote: unknown[]): Attempt[] {
  const byId = new Map(local.map((attempt) => [attempt.id, parseAttempt(attempt)]));
  for (const candidate of remote) {
    const attempt = parseAttempt(candidate);
    // D1 is the immutable source of truth when the same UUID already exists.
    byId.set(attempt.id, attempt);
  }
  return [...byId.values()].sort(compareAttempts);
}

export function rebuildLearningState(
  attempts: Attempt[]
): Pick<PeterLingoSnapshot, 'scheduledUnits' | 'mastery'> {
  const scheduled = new Map<string, ReturnType<FsrsScheduler['create']>>();
  const mastery = new Map<string, MasteryRecord>();

  for (const attempt of [...attempts].sort(compareAttempts)) {
    const reviewedAt = new Date(attempt.attemptedAt);
    const current =
      scheduled.get(attempt.learningUnitId) ?? scheduler.create(attempt.learningUnitId, reviewedAt);
    scheduled.set(attempt.learningUnitId, scheduler.review(current, attempt.grade, reviewedAt));
    mastery.set(attempt.learningUnitId, {
      learningUnitId: attempt.learningUnitId,
      discipline: attempt.discipline,
      stage: stageFor(attempt),
      strength: strengthFor(attempt),
      updatedAt: attempt.attemptedAt,
    });
  }

  return {
    scheduledUnits: [...scheduled.values()].sort((a, b) =>
      a.learningUnitId.localeCompare(b.learningUnitId)
    ),
    mastery: [...mastery.values()].sort((a, b) => a.learningUnitId.localeCompare(b.learningUnitId)),
  };
}

export function mergeCloudAttempts(
  latestLocal: PeterLingoSnapshot,
  remoteAttempts: unknown[]
): PeterLingoSnapshot {
  const attempts = mergeAttempts(latestLocal.attempts, remoteAttempts);
  return {
    ...latestLocal,
    attempts,
    ...rebuildLearningState(attempts),
  };
}
