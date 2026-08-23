import { describe, expect, it } from 'vitest';
import type { MasteryRecord } from '../../learning/types';
import {
  EAR_CURRICULUM_VERSION,
  EAR_INTERVALS,
  INTERVAL_PRESENTATIONS,
  intervalLearningUnitId,
  selectIntervalForPresentation,
} from './curriculum';
import { buildDailyEarRound, createEarExercise } from './exercises';

describe('Hørelære curriculum', () => {
  it('covers the four beginner intervals in all three presentations', () => {
    expect(EAR_CURRICULUM_VERSION).toBe(1);
    expect(EAR_INTERVALS.map((interval) => interval.semitones)).toEqual([3, 4, 5, 7]);
    expect(INTERVAL_PRESENTATIONS).toEqual(['ascending', 'descending', 'harmonic']);
  });

  it('generates playable roots in a comfortable middle register', () => {
    const descending = createEarExercise(EAR_INTERVALS[3]!, 'descending', 5);
    const harmonic = createEarExercise(EAR_INTERVALS[0]!, 'harmonic', 11);
    expect(descending.parameters.targetMidi).toBeLessThan(descending.parameters.rootMidi);
    expect(harmonic.parameters.targetMidi).toBeGreaterThan(harmonic.parameters.rootMidi);
    expect(harmonic.parameters.harmonic).toBe(true);
    for (const midi of [
      descending.parameters.rootMidi,
      descending.parameters.targetMidi,
      harmonic.parameters.rootMidi,
      harmonic.parameters.targetMidi,
    ])
      expect(midi).toBeGreaterThanOrEqual(55);
  });

  it('selects the weakest interval independently for each presentation', () => {
    const mastery: MasteryRecord[] = EAR_INTERVALS.slice(0, 3).map((interval, index) => ({
      learningUnitId: intervalLearningUnitId(interval, 'harmonic'),
      discipline: 'music-ear',
      stage: 'assisted',
      strength: 0.2 + index * 0.2,
      updatedAt: '2026-08-23T12:00:00.000Z',
    }));
    expect(selectIntervalForPresentation(mastery, 'harmonic', 0)).toBe(EAR_INTERVALS[3]);
  });

  it('builds a three-question round with every presentation exactly once', () => {
    const round = buildDailyEarRound([], 42);
    expect(round).toHaveLength(3);
    expect(new Set(round.map((exercise) => exercise.parameters.presentation))).toEqual(
      new Set(INTERVAL_PRESENTATIONS)
    );
  });
});
