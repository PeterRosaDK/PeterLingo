import { describe, expect, it } from 'vitest';
import { consumeLiveMove } from './liveSolutionTracking';

describe('live solution tracking', () => {
  it('accepts the exact requested quarter-turn', () => {
    expect(consumeLiveMove("R'", "R'", null)).toEqual({ status: 'matched', pending: null });
    expect(consumeLiveMove('R', "R'", null)).toEqual({ status: 'mismatch', pending: null });
  });

  it('accepts a half-turn as two equal physical quarter-turns', () => {
    const first = consumeLiveMove('F2', 'F', null);
    expect(first.status).toBe('halfway');
    if (first.status !== 'halfway') throw new Error('Expected a pending half-turn');
    expect(consumeLiveMove('F2', 'F', first.pending)).toEqual({
      status: 'matched',
      pending: null,
    });
  });

  it('accepts either direction for a half-turn and detects cancellation', () => {
    const first = consumeLiveMove('U2', "U'", null);
    expect(first.status).toBe('halfway');
    if (first.status !== 'halfway') throw new Error('Expected a pending half-turn');
    expect(consumeLiveMove('U2', "U'", first.pending).status).toBe('matched');
    expect(consumeLiveMove('U2', 'U', first.pending).status).toBe('cancelled');
  });

  it('rejects another face while a half-turn is underway', () => {
    const first = consumeLiveMove('F2', 'F', null);
    if (first.status !== 'halfway') throw new Error('Expected a pending half-turn');
    expect(consumeLiveMove('F2', 'R', first.pending)).toEqual({
      status: 'mismatch',
      pending: null,
    });
  });
});
