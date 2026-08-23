import { describe, expect, it } from 'vitest';
import { InMemoryLearningRepository } from '../persistence/inMemoryRepository';
import { createEmptySnapshot } from '../persistence/types';
import type { Attempt } from '../learning/types';
import { synchronizeRepository } from './cloudSync';
import { mergeAttempts, mergeCloudAttempts, rebuildLearningState } from './merge';

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 'attempt-1',
    learningUnitId: 'pi:chunk:1',
    discipline: 'pi',
    exerciseId: 'pi-exercise-1',
    generatedParameters: { learningStage: 'assisted' },
    correct: true,
    responseTimeMs: 1200,
    hintsUsed: 0,
    answerRevealed: false,
    attemptedAt: '2026-08-23T10:00:00.000Z',
    grade: 'good',
    ...overrides,
  };
}

describe('cloud attempt merge', () => {
  it('unites attempts from two devices in stable chronological order', () => {
    const phone = attempt({ id: 'phone', attemptedAt: '2026-08-23T10:02:00.000Z' });
    const mac = attempt({ id: 'mac', attemptedAt: '2026-08-23T10:01:00.000Z' });

    expect(mergeAttempts([phone], [mac]).map((item) => item.id)).toEqual(['mac', 'phone']);
  });

  it('is idempotent and treats the immutable server copy as canonical', () => {
    const local = attempt({ correct: false, grade: 'again' });
    const server = attempt({ correct: true, grade: 'good' });

    const merged = mergeAttempts([local], [server, server]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.correct).toBe(true);
  });

  it('rebuilds schedule and mastery deterministically from attempt time', () => {
    const history = [
      attempt({ id: 'first', correct: false, grade: 'again' }),
      attempt({
        id: 'second',
        attemptedAt: '2026-08-23T10:05:00.000Z',
        grade: 'easy',
        generatedParameters: { learningStage: 'fluent' },
      }),
    ];

    expect(rebuildLearningState(history)).toEqual(rebuildLearningState([...history].reverse()));
    const rebuilt = rebuildLearningState(history);
    expect(rebuilt.scheduledUnits[0]?.reps).toBe(2);
    expect(rebuilt.mastery[0]).toMatchObject({ stage: 'unassisted', strength: 0.9 });
  });

  it('keeps a local attempt recorded while the request is in flight', async () => {
    const first = attempt({ id: 'first' });
    const duringRequest = attempt({
      id: 'during-request',
      attemptedAt: '2026-08-23T10:01:00.000Z',
    });
    const repository = new InMemoryLearningRepository({
      ...createEmptySnapshot(),
      attempts: [first],
    });

    const request: typeof fetch = async (_input, init) => {
      const sent = JSON.parse(String(init?.body)) as { attempts: Attempt[] };
      expect(sent.attempts.map((item) => item.id)).toEqual(['first']);
      await repository.saveAttempt(duringRequest);
      return Response.json({ attempts: [first] });
    };

    const merged = await synchronizeRepository(repository, request);
    expect(merged.attempts.map((item) => item.id)).toEqual(['first', 'during-request']);
  });

  it('rejects malformed cloud data before replacing local state', () => {
    const local = { ...createEmptySnapshot(), attempts: [attempt()] };
    expect(() => mergeCloudAttempts(local, [{ id: 'broken' }])).toThrow('ugyldigt format');
  });
});
