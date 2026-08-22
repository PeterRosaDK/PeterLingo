import { describe, expect, it, vi } from 'vitest';
import { createAttempt } from './attempts';

describe('attempt recording', () => {
  it('retains generated parameters, timing, and hint data', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'attempt-1' });
    const attempt = createAttempt(
      {
        id: 'date-1',
        learningUnitId: 'century-anchor-1900',
        discipline: 'doomsday',
        prompt: 'Dato?',
        parameters: { year: 1969 },
        hints: [],
      },
      { correct: true, responseTimeMs: 1200.4, hintsUsed: 1, answerRevealed: false, grade: 'good' },
      new Date('2026-08-23T08:00:00Z')
    );
    expect(attempt).toMatchObject({
      id: 'attempt-1',
      responseTimeMs: 1200,
      hintsUsed: 1,
      generatedParameters: { year: 1969 },
    });
    vi.unstubAllGlobals();
  });
});
