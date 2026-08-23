import { useCallback, useEffect, useRef } from 'react';
import { useLearningData } from '../app/DataProvider';
import { createAttempt } from './attempts';
import { DefaultGradingPolicy } from './fsrs/gradingPolicy';
import { FsrsScheduler } from './fsrs/scheduler';
import type { GeneratedExercise, LearningStage } from './types';

const scheduler = new FsrsScheduler();
const grading = new DefaultGradingPolicy();

export function useAttemptRecorder(exercise: GeneratedExercise) {
  const { repository, snapshot, refresh } = useLearningData();
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    startedAt.current = performance.now();
  }, [exercise.id]);

  const restartTimer = useCallback(() => {
    startedAt.current = performance.now();
  }, []);

  const record = useCallback(
    async ({
      correct,
      hintsUsed,
      answerRevealed,
      stage,
      fluentThresholdMs,
      parameterOverrides,
    }: {
      correct: boolean;
      hintsUsed: number;
      answerRevealed: boolean;
      stage: LearningStage;
      fluentThresholdMs: number;
      parameterOverrides?: Record<string, unknown>;
    }) => {
      const now = performance.now();
      const responseTimeMs = now - (startedAt.current ?? now);
      const grade = grading.grade({
        correct,
        responseTimeMs,
        hintsUsed,
        totalHints: exercise.hints.length,
        answerRevealed,
        stage,
        fluentThresholdMs,
      });
      const recordedExercise = parameterOverrides
        ? { ...exercise, parameters: { ...exercise.parameters, ...parameterOverrides } }
        : exercise;
      const attempt = createAttempt(recordedExercise, {
        correct,
        responseTimeMs,
        hintsUsed,
        answerRevealed,
        grade,
      });
      const current =
        snapshot.scheduledUnits.find((item) => item.learningUnitId === exercise.learningUnitId) ??
        scheduler.create(exercise.learningUnitId);
      await repository.saveAttempt(attempt);
      await repository.saveScheduledUnit(scheduler.review(current, grade));
      await repository.saveMastery({
        learningUnitId: exercise.learningUnitId,
        discipline: exercise.discipline,
        stage: correct && hintsUsed === 0 ? 'unassisted' : stage,
        strength: grade === 'easy' ? 0.9 : grade === 'good' ? 0.68 : grade === 'hard' ? 0.42 : 0.18,
        updatedAt: new Date().toISOString(),
      });
      await refresh();
      return attempt;
    },
    [exercise, refresh, repository, snapshot.scheduledUnits]
  );

  return { record, restartTimer };
}
