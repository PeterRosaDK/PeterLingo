import { describe, expect, it } from 'vitest';
import type { ScheduledLearningUnit } from '../../learning/fsrs/scheduler';
import type { MasteryRecord } from '../../learning/types';
import { CARDS_SKILLS } from './curriculum';
import { createCardsExercise, recommendMbcTarget } from './exercises';

describe('BCS/MBCS exercises', () => {
  it.each(CARDS_SKILLS)('creates a valid exercise for $title', (skill) => {
    const exercise = createCardsExercise(skill.id, 126, 22);

    expect(exercise.parameters.skill).toBe(skill.id);
    expect(exercise.choices.some((choice) => choice.value === exercise.parameters.answer)).toBe(
      true
    );
    expect(new Set(exercise.choices.map((choice) => choice.value)).size).toBe(
      exercise.choices.length
    );
    expect(exercise.hints.at(-1)?.revealsAnswer).toBe(true);
  });

  it('stores each MBCS direction as its own stable learning unit', () => {
    const cardToPosition = createCardsExercise('card-to-position', 0, 22);
    const positionToCard = createCardsExercise('position-to-card', 0, 22);

    expect(cardToPosition.learningUnitId).toBe('cards:card-to-position:9C');
    expect(cardToPosition.parameters.answer).toBe('23');
    expect(positionToCard.learningUnitId).toBe('cards:position-to-card:23');
    expect(positionToCard.parameters.answer).toBe('9C');
  });

  it.each([0, 1, 2])('covers all three physical stack arithmetic variants', (seed) => {
    const exercise = createCardsExercise('cuts-and-targets', seed);
    expect(exercise.parameters.variant).toBe(
      seed === 0 ? 'follow-cut' : seed === 1 ? 'cut-to-target' : 'removed-top'
    );
  });

  it('trains both moving by an offset and finding a forward distance', () => {
    expect(createCardsExercise('cyclic-offsets', 0).parameters.variant).toBe('move-offset');
    expect(createCardsExercise('cyclic-offsets', 52).parameters.variant).toBe('forward-distance');
  });

  it('selects a due exact MBCS association before an unseen one', () => {
    const mastery: MasteryRecord[] = [];
    const due: ScheduledLearningUnit = {
      learningUnitId: 'cards:position-to-card:23',
      due: '2026-08-22T12:00:00.000Z',
      stability: 1,
      difficulty: 5,
      elapsedDays: 0,
      scheduledDays: 1,
      reps: 1,
      lapses: 0,
      learningSteps: 1,
      state: 1,
    };

    expect(
      recommendMbcTarget(
        'position-to-card',
        mastery,
        [due],
        0,
        new Date('2026-08-23T12:00:00.000Z')
      )
    ).toBe(22);
  });
});
