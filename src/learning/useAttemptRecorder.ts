import { masteryForAttempt } from './mastery';
import { gradeSelfRecall } from './fsrs/selfRating';
import { useCallback, useEffect, useRef } from 'react';
import { useLearningData } from '../app/DataProvider';
import { playCorrectAnswerCue } from '../audio/correctAnswerCue';
import { createAttempt } from './attempts';
import { DefaultGradingPolicy } from './fsrs/gradingPolicy';
import { FsrsScheduler } from './fsrs/scheduler';
import type { GeneratedExercise, LearningStage, SchedulerGrade } from './types';

const scheduler = new FsrsScheduler();
const grading = new DefaultGradingPolicy();

export function useAttemptRecorder(exercise: GeneratedExercise) {
  const { repository, snapshot, refresh, syncNow } = useLearningData();
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
      selfRating,
    }: {
      selfRating?: SchedulerGrade;
      correct: boolean;
      hintsUsed: number;
      answerRevealed: boolean;
      stage: LearningStage;
      fluentThresholdMs: number;
      parameterOverrides?: Record<string, unknown>;
    }) => {
      if (correct) void playCorrectAnswerCue(snapshot.settings.feedbackSounds !== false);
      const now = performance.now();
      const responseTimeMs = now - (startedAt.current ?? now);
      const grade = selfRating
        ? gradeSelfRecall(selfRating, hintsUsed, answerRevealed)
        : grading.grade({
            correct,
            responseTimeMs,
            hintsUsed,
            totalHints: exercise.hints.length,
            answerRevealed,
            stage,
            fluentThresholdMs,
          });
      const recordedExercise = {
        ...exercise,
        parameters: {
          ...exercise.parameters,
          ...parameterOverrides,
          learningStage: stage,
          ...(selfRating ? { recallMode: 'self-report', selfRating } : {}),
        },
      };
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
      await repository.saveScheduledUnit(
        scheduler.review(current, grade, new Date(attempt.attemptedAt))
      );
      await repository.saveMastery(masteryForAttempt(attempt));
      await refresh();
      void syncNow();
      return attempt;
    },
    [
      exercise,
      refresh,
      repository,
      snapshot.scheduledUnits,
      snapshot.settings.feedbackSounds,
      syncNow,
    ]
  );

  return { record, restartTimer };
}
