import type { AttemptEvaluation, SchedulerGrade } from '../types';

export interface GradingPolicy {
  grade(evaluation: AttemptEvaluation): SchedulerGrade;
}

export class DefaultGradingPolicy implements GradingPolicy {
  grade(evaluation: AttemptEvaluation): SchedulerGrade {
    if (!evaluation.correct || evaluation.answerRevealed) return 'again';

    const hintRatio =
      evaluation.totalHints === 0 ? 0 : evaluation.hintsUsed / evaluation.totalHints;
    if (hintRatio >= 0.5 || evaluation.hintsUsed > 1) return 'hard';

    const slow = evaluation.responseTimeMs > evaluation.fluentThresholdMs;
    if (evaluation.hintsUsed === 1 || slow) {
      return evaluation.stage === 'teaching' && !slow ? 'good' : 'hard';
    }

    const clearlyFluent =
      evaluation.stage !== 'teaching' &&
      evaluation.responseTimeMs <= evaluation.fluentThresholdMs * 0.55;
    return clearlyFluent ? 'easy' : 'good';
  }
}
