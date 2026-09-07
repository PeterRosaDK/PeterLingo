import type { Attempt, LearningStage, MasteryRecord } from './types';
const stages: LearningStage[] = ['teaching', 'assisted', 'unassisted', 'fluent'];
export function masteryForAttempt(attempt: Attempt): MasteryRecord {
  const prior = attempt.generatedParameters.learningStage;
  const stage: LearningStage =
    attempt.grade === 'easy'
      ? 'fluent'
      : attempt.correct && attempt.hintsUsed === 0 && !attempt.answerRevealed
        ? 'unassisted'
        : stages.includes(prior as LearningStage)
          ? (prior as LearningStage)
          : 'assisted';
  return {
    learningUnitId: attempt.learningUnitId,
    discipline: attempt.discipline,
    stage,
    strength: { again: 0.18, hard: 0.42, good: 0.68, easy: 0.9 }[attempt.grade],
    updatedAt: attempt.attemptedAt,
  };
}
