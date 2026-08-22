import { Rating, createEmptyCard, fsrs, type Card, type Grade, type State } from 'ts-fsrs';
import type { SchedulerGrade } from '../types';

export interface ScheduledLearningUnit {
  learningUnitId: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  learningSteps: number;
  state: number;
  lastReview?: string;
}

export interface Scheduler {
  create(learningUnitId: string, now?: Date): ScheduledLearningUnit;
  review(card: ScheduledLearningUnit, grade: SchedulerGrade, now?: Date): ScheduledLearningUnit;
  isDue(card: ScheduledLearningUnit, now?: Date): boolean;
}

const ratingMap: Record<SchedulerGrade, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

function serialize(learningUnitId: string, card: Card): ScheduledLearningUnit {
  return {
    learningUnitId,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learningSteps: card.learning_steps,
    state: card.state,
    lastReview: card.last_review?.toISOString(),
  };
}

function deserialize(card: ScheduledLearningUnit): Card {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    learning_steps: card.learningSteps,
    state: card.state as State,
    last_review: card.lastReview ? new Date(card.lastReview) : undefined,
  };
}

export class FsrsScheduler implements Scheduler {
  private readonly engine = fsrs({
    request_retention: 0.9,
    maximum_interval: 36_500,
    enable_fuzz: true,
    enable_short_term: true,
  });

  create(learningUnitId: string, now = new Date()): ScheduledLearningUnit {
    return serialize(learningUnitId, createEmptyCard(now));
  }

  review(
    current: ScheduledLearningUnit,
    grade: SchedulerGrade,
    now = new Date()
  ): ScheduledLearningUnit {
    const result = this.engine.next(deserialize(current), now, ratingMap[grade]);
    return serialize(current.learningUnitId, result.card);
  }

  isDue(card: ScheduledLearningUnit, now = new Date()): boolean {
    return new Date(card.due).getTime() <= now.getTime();
  }
}
