import { describe, expect, it } from 'vitest';
import type { Attempt, LearningUnit } from '../types';
import {
  dailySessionProgress,
  dailySessionReason,
  estimatedSecondsForUnit,
} from './sessionInsights';

const unit: LearningUnit = {
  id: 'pi:transition:5-6',
  discipline: 'pi',
  title: 'Pi-overgang',
  stage: 'assisted',
  estimatedSeconds: 60,
};

function attempt(overrides: Partial<Attempt>): Attempt {
  return {
    id: 'attempt-1',
    learningUnitId: unit.id,
    discipline: 'pi',
    exerciseId: 'exercise-1',
    generatedParameters: {},
    correct: true,
    responseTimeMs: 8_000,
    hintsUsed: 0,
    answerRevealed: false,
    attemptedAt: new Date(2026, 7, 23, 10).toISOString(),
    grade: 'good',
    ...overrides,
  };
}

describe('daily session insights', () => {
  it('explains due, new, and known weak work', () => {
    const now = new Date('2026-08-23T10:00:00.000Z');
    const dueCard = {
      learningUnitId: unit.id,
      due: '2026-08-22T10:00:00.000Z',
      stability: 1,
      difficulty: 5,
      elapsedDays: 1,
      scheduledDays: 1,
      reps: 1,
      lapses: 0,
      learningSteps: 0,
      state: 2,
    };
    expect(dailySessionReason(unit, [dueCard], [], now)).toBe('due-review');
    expect(dailySessionReason(unit, [], [], now)).toBe('new-learning');
    expect(
      dailySessionReason(unit, [{ ...dueCard, due: '2026-08-24T10:00:00.000Z' }], [], now)
    ).toBe('weak-area');
  });

  it('calibrates duration gently from recent response times', () => {
    expect(estimatedSecondsForUnit(unit, [])).toBe(60);
    expect(estimatedSecondsForUnit(unit, [attempt({ responseTimeMs: 8_000 })])).toBe(44);
  });

  it('counts each planned unit once while retaining the attempt summary', () => {
    const secondUnit = { ...unit, id: 'pi:bridge:4-8' };
    const day = new Date(2026, 7, 23, 18);
    const progress = dailySessionProgress(
      [unit, secondUnit],
      [
        attempt({ id: 'a', attemptedAt: new Date(2026, 7, 23, 8).toISOString() }),
        attempt({ id: 'b', correct: false, hintsUsed: 1 }),
        attempt({
          id: 'c',
          learningUnitId: secondUnit.id,
          attemptedAt: new Date(2026, 7, 22, 20).toISOString(),
        }),
      ],
      day
    );
    expect(progress).toMatchObject({
      completedUnitIds: [unit.id],
      completedCount: 1,
      attemptCount: 2,
      correctCount: 1,
      hintsUsed: 1,
      complete: false,
    });
  });
});
