import type { CalendarDate, CalendarSystem } from './calendar';
import { mod } from './calendar';

export const DANISH_WEEKDAYS = [
  'søndag',
  'mandag',
  'tirsdag',
  'onsdag',
  'torsdag',
  'fredag',
  'lørdag',
] as const;
export const DANISH_MONTHS = [
  'januar',
  'februar',
  'marts',
  'april',
  'maj',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'december',
] as const;

export interface DoomsdayCalculation {
  date: CalendarDate;
  centuryAnchor: number;
  yearParts: { dozen: number; remainder: number; quarterRemainder: number };
  yearDoomsday: number;
  monthAnchorDay: number;
  dayOffset: number;
  weekday: number;
}

export class GregorianCalendar implements CalendarSystem {
  readonly id = 'proleptic-gregorian';

  isLeapYear(year: number): boolean {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }

  weekday(date: CalendarDate): number {
    return calculateDoomsday(date, this).weekday;
  }
}

export function centuryAnchor(year: number): number {
  const century = Math.floor(year / 100);
  return mod(5 * mod(century, 4) + 2, 7);
}

export function monthAnchorDay(month: number, leap: boolean): number {
  const anchors = [0, leap ? 4 : 3, leap ? 29 : 28, 14, 4, 9, 6, 11, 8, 5, 10, 7, 12];
  const anchor = anchors[month];
  if (!anchor) throw new RangeError('Måneden skal være 1–12.');
  return anchor;
}

export function calculateDoomsday(
  date: CalendarDate,
  calendar = new GregorianCalendar()
): DoomsdayCalculation {
  if (
    !Number.isInteger(date.year) ||
    !Number.isInteger(date.month) ||
    !Number.isInteger(date.day)
  ) {
    throw new TypeError('Datoen skal bestå af hele tal.');
  }
  const native = new Date(Date.UTC(date.year, date.month - 1, date.day));
  if (
    native.getUTCFullYear() !== date.year ||
    native.getUTCMonth() !== date.month - 1 ||
    native.getUTCDate() !== date.day
  ) {
    throw new RangeError('Datoen findes ikke i den gregorianske kalender.');
  }

  const yy = mod(date.year, 100);
  const dozen = Math.floor(yy / 12);
  const remainder = yy % 12;
  const quarterRemainder = Math.floor(remainder / 4);
  const anchor = centuryAnchor(date.year);
  const yearDoomsday = mod(anchor + dozen + remainder + quarterRemainder, 7);
  const monthAnchor = monthAnchorDay(date.month, calendar.isLeapYear(date.year));
  const dayOffset = date.day - monthAnchor;
  const weekday = mod(yearDoomsday + dayOffset, 7);
  return {
    date,
    centuryAnchor: anchor,
    yearParts: { dozen, remainder, quarterRemainder },
    yearDoomsday,
    monthAnchorDay: monthAnchor,
    dayOffset,
    weekday,
  };
}
