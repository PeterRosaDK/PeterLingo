import type { GeneratedExercise } from '../../learning/types';
import type { CalendarDate } from './calendar';
import { calculateDoomsday, DANISH_MONTHS, DANISH_WEEKDAYS } from './doomsday';

export type DoomsdayExercise = GeneratedExercise<{
  year: number;
  month: number;
  day: number;
  answer: number;
}>;

export function createDateExercise(date: CalendarDate): DoomsdayExercise {
  const calculation = calculateDoomsday(date);
  const weekday = DANISH_WEEKDAYS[calculation.weekday];
  return {
    id: `doomsday:${date.year}-${date.month}-${date.day}`,
    learningUnitId: 'doomsday:complete-date',
    discipline: 'doomsday',
    prompt: `Hvilken ugedag var ${date.day}. ${DANISH_MONTHS[date.month - 1]} ${date.year}?`,
    parameters: { ...date, answer: calculation.weekday },
    hints: [
      {
        id: 'century',
        label: 'Århundredets anker',
        content: `${Math.floor(date.year / 100)}00-tallet har ${DANISH_WEEKDAYS[calculation.centuryAnchor]} som ankerdag.`,
      },
      {
        id: 'year-parts',
        label: 'Del året op',
        content: `${date.year % 100} = ${calculation.yearParts.dozen}×12 + ${calculation.yearParts.remainder}; kvartdelen er ${calculation.yearParts.quarterRemainder}.`,
      },
      {
        id: 'year-doomsday',
        label: 'Årets dommedag',
        content: `Årets dommedag er ${DANISH_WEEKDAYS[calculation.yearDoomsday]}.`,
      },
      {
        id: 'month-anchor',
        label: 'Månedens anker',
        content: `${calculation.monthAnchorDay}. ${DANISH_MONTHS[date.month - 1]} falder på årets dommedag.`,
      },
      {
        id: 'offset',
        label: 'Dagforskellen',
        content: `Flyt ${Math.abs(calculation.dayOffset)} dag${Math.abs(calculation.dayOffset) === 1 ? '' : 'e'} ${calculation.dayOffset < 0 ? 'tilbage' : 'frem'}.`,
      },
      { id: 'answer', label: 'Vis svaret', content: `Svaret er ${weekday}.`, revealsAnswer: true },
    ],
  };
}

export function generatedModernDate(seed = Date.now()): CalendarDate {
  const value = Math.abs(Math.trunc(seed));
  const year = 1950 + (value % 101);
  const month = 1 + (Math.floor(value / 101) % 12);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = 1 + (Math.floor(value / 1212) % days);
  return { year, month, day };
}
