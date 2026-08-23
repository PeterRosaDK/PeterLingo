import { describe, expect, it } from 'vitest';
import { greetingForHour } from './greeting';

describe('greetingForHour', () => {
  it.each([
    [0, 'Godnat'],
    [6, 'Godnat'],
    [7, 'Godmorgen'],
    [10, 'Godmorgen'],
    [11, 'Goddag'],
    [17, 'Goddag'],
    [18, 'Godaften'],
    [23, 'Godaften'],
  ] as const)('uses the local greeting at hour %i', (hour, greeting) => {
    expect(greetingForHour(hour)).toBe(greeting);
  });

  it.each([-1, 24, 7.5, Number.NaN])('rejects invalid hour %s', (hour) => {
    expect(() => greetingForHour(hour)).toThrow(RangeError);
  });
});
