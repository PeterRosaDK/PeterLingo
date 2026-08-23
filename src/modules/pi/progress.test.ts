import { describe, expect, it } from 'vitest';
import type { Attempt, MasteryRecord } from '../../learning/types';
import { piLearningProfile, selectBridgeWindow, selectKnownWindow } from './progress';

const attempt = (correctDigits: number): Attempt => ({
  id: `prefix-${correctDigits}`,
  learningUnitId: 'pi:prefix-diagnostic',
  discipline: 'pi',
  exerciseId: 'pi:prefix-run',
  generatedParameters: { correctDigits },
  correct: false,
  responseTimeMs: 10_000,
  hintsUsed: 0,
  answerRevealed: false,
  attemptedAt: '2026-08-23T12:00:00.000Z',
  grade: 'again',
});

const mastery = (id: string, strength = 0.68): MasteryRecord => ({
  learningUnitId: id,
  discipline: 'pi',
  stage: 'unassisted',
  strength,
  updatedAt: '2026-08-23T12:00:00.000Z',
});

describe('adaptive Pi frontier', () => {
  it('starts at Peter’s stated familiarity and never opens a random distant window', () => {
    expect(piLearningProfile([], [])).toMatchObject({
      workingBoundary: 30,
      nextChunkStart: 31,
      nextChunkEnd: 35,
    });
    expect(selectKnownWindow(30, 999)).toBeLessThanOrEqual(26);
  });

  it('uses a stronger prefix diagnosis and contiguous learned chunks', () => {
    expect(piLearningProfile([attempt(47)], []).workingBoundary).toBe(45);
    expect(
      piLearningProfile([attempt(30)], [mastery('pi:chunk:31-35'), mastery('pi:chunk:36-40')])
        .workingBoundary
    ).toBe(40);
  });

  it('does not skip an unlearned chunk', () => {
    expect(piLearningProfile([], [mastery('pi:chunk:36-40')]).workingBoundary).toBe(30);
  });

  it('keeps known and bridge windows inside the working boundary', () => {
    expect(selectKnownWindow(30, 5, 5)).toBe(26);
    const bridge = selectBridgeWindow(30, 2, 5);
    expect(bridge).toBeGreaterThanOrEqual(1);
    expect(bridge + 4).toBeLessThanOrEqual(30);
  });
});
