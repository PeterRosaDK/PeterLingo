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
  const centuryStart = Math.floor(date.year / 100) * 100;
  const yearSteps =
    calculation.yearParts.dozen +
    calculation.yearParts.remainder +
    calculation.yearParts.quarterRemainder;
  const shortYearSteps = yearSteps % 7;
  const shortDaySteps = Math.abs(calculation.dayOffset) % 7;
  return {
    id: `doomsday:${date.year}-${date.month}-${date.day}`,
    learningUnitId: 'doomsday:complete-date',
    discipline: 'doomsday',
    prompt: `Hvilken ugedag var ${date.day}. ${DANISH_MONTHS[date.month - 1]} ${date.year}?`,
    parameters: { ...date, answer: calculation.weekday },
    hints: [
      {
        id: 'century',
        label: 'Start med århundredet',
        content: `Alle år fra ${centuryStart} til ${centuryStart + 99} bruger ${DANISH_WEEKDAYS[calculation.centuryAnchor]} som deres faste udgangspunkt.`,
      },
      {
        id: 'year-parts',
        label: 'Se på årets sidste to cifre',
        content: `${date.year % 100} rummer ${calculation.yearParts.dozen} hele grupper på 12 og ${calculation.yearParts.remainder} år i rest. Resten giver ${calculation.yearParts.quarterRemainder} ekstra skudårsdag. Det er ${yearSteps} skridt i alt — eller bare ${shortYearSteps}, når hele uger fjernes.`,
      },
      {
        id: 'year-doomsday',
        label: 'Find årets fælles ugedag',
        content: `Gå ${shortYearSteps} plads${shortYearSteps === 1 ? '' : 'er'} frem fra ${DANISH_WEEKDAYS[calculation.centuryAnchor]}. Du lander på ${DANISH_WEEKDAYS[calculation.yearDoomsday]}, som er årets dommedag.`,
      },
      {
        id: 'month-anchor',
        label: 'Brug månedens huskedato',
        content: `${calculation.monthAnchorDay}. ${DANISH_MONTHS[date.month - 1]} er månedens huskedato og falder derfor på ${DANISH_WEEKDAYS[calculation.yearDoomsday]}.`,
      },
      {
        id: 'offset',
        label: 'Gå hen til måldatoen',
        content: `${date.day}. ligger ${Math.abs(calculation.dayOffset)} dag${Math.abs(calculation.dayOffset) === 1 ? '' : 'e'} ${calculation.dayOffset < 0 ? 'før' : 'efter'} huskedatoen. Hele uger kan ignoreres, så gå ${shortDaySteps} plads${shortDaySteps === 1 ? '' : 'er'} ${calculation.dayOffset < 0 ? 'tilbage' : 'frem'} på ugehjulet.`,
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
