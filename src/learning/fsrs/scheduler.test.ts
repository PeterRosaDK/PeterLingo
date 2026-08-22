import { describe, expect, it } from 'vitest';
import { FsrsScheduler } from './scheduler';

describe('FSRS boundary', () => {
  const scheduler = new FsrsScheduler();
  const now = new Date('2026-08-23T08:00:00Z');

  it('creates a due card for a stable learning-unit identity', () => {
    const card = scheduler.create('interval:m3:descending', now);
    expect(card.learningUnitId).toBe('interval:m3:descending');
    expect(scheduler.isDue(card, now)).toBe(true);
  });

  it('schedules without exposing ts-fsrs to domain modules', () => {
    const card = scheduler.review(scheduler.create('pi:digits:1-5', now), 'good', now);
    expect(card.reps).toBe(1);
    expect(new Date(card.due).getTime()).toBeGreaterThan(now.getTime());
  });
});
