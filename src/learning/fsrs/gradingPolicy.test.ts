import { describe, expect, it } from 'vitest';
import { DefaultGradingPolicy } from './gradingPolicy';

const policy = new DefaultGradingPolicy();
const base = {
  correct: true,
  responseTimeMs: 4_000,
  hintsUsed: 0,
  totalHints: 4,
  answerRevealed: false,
  stage: 'unassisted' as const,
  fluentThresholdMs: 8_000,
};

describe('automatic grading policy', () => {
  it('grades incorrect and revealed answers again', () => {
    expect(policy.grade({ ...base, correct: false })).toBe('again');
    expect(policy.grade({ ...base, answerRevealed: true })).toBe('again');
  });

  it('treats substantial help as hard', () => {
    expect(policy.grade({ ...base, hintsUsed: 2 })).toBe('hard');
  });

  it('does not heavily punish one teaching hint', () => {
    expect(policy.grade({ ...base, stage: 'teaching', hintsUsed: 1 })).toBe('good');
  });

  it('separates slow recall from fluent recall', () => {
    expect(policy.grade({ ...base, responseTimeMs: 12_000 })).toBe('hard');
    expect(policy.grade({ ...base, responseTimeMs: 3_000 })).toBe('easy');
  });
});
