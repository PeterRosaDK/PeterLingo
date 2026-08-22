import { describe, expect, it } from 'vitest';
import { calculateDoomsday, centuryAnchor, GregorianCalendar } from './doomsday';

describe('Gregorian Doomsday', () => {
  const calendar = new GregorianCalendar();

  it.each([
    [{ year: 2000, month: 1, day: 1 }, 6],
    [{ year: 1969, month: 7, day: 20 }, 0],
    [{ year: 2026, month: 8, day: 23 }, 0],
  ])('calculates known date %j', (date, weekday) => {
    expect(calendar.weekday(date)).toBe(weekday);
  });

  it.each([
    [1900, false],
    [2000, true],
    [2100, false],
    [2024, true],
  ])('applies leap rules for %i', (year, expected) => {
    expect(calendar.isLeapYear(year)).toBe(expected);
  });

  it('calculates common century anchors', () => {
    expect(centuryAnchor(1800)).toBe(5);
    expect(centuryAnchor(1900)).toBe(3);
    expect(centuryAnchor(2000)).toBe(2);
    expect(centuryAnchor(2100)).toBe(0);
  });

  it('exposes the mental calculation parts', () => {
    expect(calculateDoomsday({ year: 2026, month: 8, day: 23 })).toMatchObject({
      centuryAnchor: 2,
      yearParts: { dozen: 2, remainder: 2, quarterRemainder: 0 },
      yearDoomsday: 6,
      monthAnchorDay: 8,
      dayOffset: 15,
      weekday: 0,
    });
  });
});
