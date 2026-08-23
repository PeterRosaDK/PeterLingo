import { describe, expect, it } from 'vitest';
import type { Attempt, DisciplineId } from '../types';
import { attemptsOnDay, dailyStars, dailyStarTotal } from './dailyStars';

const attempt = (
  id: string,
  discipline: DisciplineId,
  attemptedAt: Date,
  correct = false
): Attempt => ({
  id,
  learningUnitId: `${discipline}:unit`,
  discipline,
  exerciseId: `${discipline}:exercise`,
  generatedParameters: {},
  correct,
  responseTimeMs: 1_000,
  hintsUsed: correct ? 0 : 2,
  answerRevealed: !correct,
  attemptedAt: attemptedAt.toISOString(),
  grade: correct ? 'good' : 'again',
});

describe('non-punitive daily stars', () => {
  const today = new Date(2026, 7, 23, 12);

  it('awards one star per completed attempt, including learning with hints', () => {
    const attempts = [
      attempt('1', 'pi', new Date(2026, 7, 23, 9), false),
      attempt('2', 'pi', new Date(2026, 7, 23, 10), true),
    ];
    expect(dailyStars(attempts, 'pi', today)).toBe(2);
  });

  it('caps each subject at three stars and ignores another local day', () => {
    const attempts = [
      ...[1, 2, 3, 4].map((id) => attempt(String(id), 'cards', new Date(2026, 7, 23, id))),
      attempt('old', 'cards', new Date(2026, 7, 22, 23)),
    ];
    expect(dailyStars(attempts, 'cards', today)).toBe(3);
    expect(attemptsOnDay(attempts, today)).toHaveLength(4);
  });

  it('totals the five independent subject goals', () => {
    const attempts = [
      attempt('pi', 'pi', today),
      attempt('cards', 'cards', today),
      attempt('doom', 'doomsday', today),
    ];
    expect(dailyStarTotal(attempts, today)).toBe(3);
  });
});
