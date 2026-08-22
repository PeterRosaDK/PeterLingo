import { describe, expect, it } from 'vitest';
import { createContinueExercise, createFillGapExercise } from './exercises';
import { digits, PI_100 } from './piData';

describe('Pi source and windows', () => {
  it('contains exactly the first 100 decimal digits', () => {
    expect(PI_100).toHaveLength(100);
    expect(PI_100).toMatch(/^\d{100}$/);
    expect(PI_100.slice(0, 30)).toBe('141592653589793238462643383279');
  });

  it('uses one-based index semantics', () => {
    expect(digits(1, 5)).toBe('14159');
    expect(digits(96, 5)).toBe('70679');
  });

  it('extracts cross-boundary windows', () => {
    expect(digits(4, 5)).toBe('59265');
    expect(digits(8, 5)).toBe('53589');
  });

  it('generates non-prefix continuation and gap exercises', () => {
    expect(createContinueExercise(16).parameters).toMatchObject({ start: 16, answer: '23846' });
    expect(createFillGapExercise(24).parameters).toMatchObject({ start: 24, answer: '33832' });
  });
});
