import { describe, expect, it } from 'vitest';
import { learningCatalog } from './catalog';
import { selectDailySession } from './sessionSelector';

describe('daily session selection', () => {
  it('prioritizes due work without forcing equal subject quotas', () => {
    const result = selectDailySession({
      catalog: learningCatalog,
      scheduled: [
        {
          learningUnitId: 'pi:bridge:6-10',
          due: '2026-08-22T00:00:00Z',
          stability: 1,
          difficulty: 5,
          elapsedDays: 1,
          scheduledDays: 1,
          reps: 1,
          lapses: 0,
          learningSteps: 0,
          state: 2,
        },
      ],
      mastery: [],
      recentSessions: [],
      focusWeights: { pi: 2 },
      now: new Date('2026-08-23T08:00:00Z'),
      maxNewItems: 2,
    });
    expect(result[0]?.id).toBe('pi:bridge:6-10');
    expect(result.filter((unit) => unit.id !== 'pi:bridge:6-10' && unit.isNew)).toHaveLength(2);
  });

  it('keeps dynamically generated learning units eligible for later review', () => {
    const result = selectDailySession({
      catalog: learningCatalog,
      scheduled: [
        {
          learningUnitId: 'music-ear:interval:8:descending',
          due: '2026-08-22T00:00:00Z',
          stability: 1,
          difficulty: 5,
          elapsedDays: 1,
          scheduledDays: 1,
          reps: 1,
          lapses: 0,
          learningSteps: 0,
          state: 2,
        },
      ],
      mastery: [],
      recentSessions: [],
      focusWeights: {},
      now: new Date('2026-08-23T08:00:00Z'),
      maxNewItems: 0,
    });
    expect(result[0]).toMatchObject({
      id: 'music-ear:interval:8:descending',
      discipline: 'music-ear',
    });
  });
});
