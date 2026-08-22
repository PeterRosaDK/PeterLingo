import type { Attempt, GeneratedExercise, SchedulerGrade } from './types';

export function createAttempt(
  exercise: GeneratedExercise,
  result: {
    correct: boolean;
    responseTimeMs: number;
    hintsUsed: number;
    answerRevealed: boolean;
    grade: SchedulerGrade;
  },
  now = new Date()
): Attempt {
  return {
    id: crypto.randomUUID(),
    learningUnitId: exercise.learningUnitId,
    discipline: exercise.discipline,
    exerciseId: exercise.id,
    generatedParameters: exercise.parameters,
    correct: result.correct,
    responseTimeMs: Math.max(0, Math.round(result.responseTimeMs)),
    hintsUsed: Math.max(0, result.hintsUsed),
    answerRevealed: result.answerRevealed,
    attemptedAt: now.toISOString(),
    grade: result.grade,
  };
}
