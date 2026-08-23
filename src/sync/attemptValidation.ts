import type { Attempt, DisciplineId, LearningStage, SchedulerGrade } from '../learning/types';

const disciplines = new Set<DisciplineId>(['doomsday', 'roux', 'cards', 'pi', 'music-ear']);
const grades = new Set<SchedulerGrade>(['again', 'hard', 'good', 'easy']);
const stages = new Set<LearningStage>(['teaching', 'assisted', 'unassisted', 'fluent']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isBoundedString(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum;
}

export function isLearningStage(value: unknown): value is LearningStage {
  return typeof value === 'string' && stages.has(value as LearningStage);
}

export function parseAttempt(value: unknown): Attempt {
  if (!isRecord(value)) throw new Error('Et synkroniseret forsøg er ikke et objekt.');

  const attemptedAt = value.attemptedAt;
  if (
    !isBoundedString(value.id, 128) ||
    !isBoundedString(value.learningUnitId, 256) ||
    !isBoundedString(value.exerciseId, 256) ||
    typeof value.discipline !== 'string' ||
    !disciplines.has(value.discipline as DisciplineId) ||
    !isRecord(value.generatedParameters) ||
    typeof value.correct !== 'boolean' ||
    typeof value.responseTimeMs !== 'number' ||
    !Number.isFinite(value.responseTimeMs) ||
    value.responseTimeMs < 0 ||
    typeof value.hintsUsed !== 'number' ||
    !Number.isInteger(value.hintsUsed) ||
    value.hintsUsed < 0 ||
    typeof value.answerRevealed !== 'boolean' ||
    !isBoundedString(attemptedAt, 64) ||
    !Number.isFinite(Date.parse(attemptedAt)) ||
    typeof value.grade !== 'string' ||
    !grades.has(value.grade as SchedulerGrade)
  ) {
    throw new Error('Et synkroniseret forsøg har et ugyldigt format.');
  }

  return value as unknown as Attempt;
}
