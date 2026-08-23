import { describe, expect, it } from 'vitest';
import { DOOMSDAY_SKILLS } from './curriculum';
import { createDoomsdayExercise } from './exercises';

describe('Doomsday curriculum exercises', () => {
  it.each(DOOMSDAY_SKILLS)('creates a valid generated exercise for $title', (skill) => {
    const exercise = createDoomsdayExercise(skill.id, 126);

    expect(exercise.learningUnitId).toBe(skill.learningUnitId);
    expect(exercise.parameters.skill).toBe(skill.id);
    expect(exercise.hints.at(-1)?.revealsAnswer).toBe(true);
    expect(exercise.choices.some((choice) => choice.value === exercise.parameters.answer)).toBe(
      true
    );
    expect(new Set(exercise.choices.map((choice) => choice.value)).size).toBe(
      exercise.choices.length
    );
  });

  it('turns 1999 into four steps from the Wednesday century anchor', () => {
    const exercise = createDoomsdayExercise('year-calculation', 24);

    expect(exercise.parameters.year).toBe(1999);
    expect(exercise.parameters.answer).toBe(0);
    expect(exercise.explanation).toContain('8 + 3 + 0 = 11');
    expect(exercise.explanation).toContain('søndag');
  });

  it('uses 29 February as the leap-year month anchor', () => {
    const exercise = createDoomsdayExercise('month-anchors', 1);

    expect(exercise.parameters).toMatchObject({ year: 2024, month: 2, leap: true, answer: 29 });
  });

  it('teaches the Gregorian century exception', () => {
    const exercise = createDoomsdayExercise('leap-years', 1);

    expect(exercise.parameters).toMatchObject({ year: 1900, leap: false, answer: 0 });
    expect(exercise.explanation).toContain('ikke et skudår');
  });

  it('focuses complete-date practice on likely birth years from 1975 through 2000', () => {
    const years = Array.from(
      { length: 104 },
      (_, seed) => createDoomsdayExercise('complete-date', seed).parameters.year
    );

    expect(Math.min(...(years as number[]))).toBe(1975);
    expect(Math.max(...(years as number[]))).toBe(2000);
  });
});
