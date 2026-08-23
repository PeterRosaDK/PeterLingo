import type { GeneratedExercise, ProgressiveHint } from '../../learning/types';
import type { CalendarDate } from './calendar';
import type { DoomsdaySkillId } from './curriculum';
import {
  calculateDoomsday,
  centuryAnchor,
  DANISH_MONTHS,
  DANISH_WEEKDAYS,
  GregorianCalendar,
  monthAnchorDay,
} from './doomsday';

export interface DoomsdayAnswerChoice {
  value: number;
  label: string;
}

export type DoomsdayExercise = GeneratedExercise<{
  skill: DoomsdaySkillId;
  answer: number;
  year?: number;
  month?: number;
  day?: number;
  direction?: 'weekday-to-number' | 'number-to-weekday';
  leap?: boolean;
}> & {
  choices: DoomsdayAnswerChoice[];
  explanation: string;
  visual: {
    label: string;
    primary: string;
    secondary: string;
  };
};

const calendar = new GregorianCalendar();

function normalizedSeed(seed: number): number {
  return Math.abs(Math.trunc(seed));
}

function pick<T>(items: readonly T[], seed: number, stride = 1): T {
  const value = items[Math.floor(normalizedSeed(seed) / stride) % items.length];
  if (value === undefined) throw new RangeError('Der skal være mindst ét valg.');
  return value;
}

function weekdayName(index: number): (typeof DANISH_WEEKDAYS)[number] {
  const weekday = DANISH_WEEKDAYS[index];
  if (!weekday) throw new RangeError('Ugedagstallet skal være 0–6.');
  return weekday;
}

function monthName(index: number): (typeof DANISH_MONTHS)[number] {
  const month = DANISH_MONTHS[index];
  if (!month) throw new RangeError('Måneden skal være 1–12.');
  return month;
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function rotate<T>(items: T[], seed: number): T[] {
  const offset = normalizedSeed(seed) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function weekdayChoices(seed: number): DoomsdayAnswerChoice[] {
  return rotate(
    DANISH_WEEKDAYS.map((weekday, value) => ({ value, label: weekday })),
    seed
  );
}

function numberedChoices(seed: number): DoomsdayAnswerChoice[] {
  return rotate(
    DANISH_WEEKDAYS.map((_, value) => ({ value, label: String(value) })),
    seed
  );
}

function dayChoices(answer: number, seed: number): DoomsdayAnswerChoice[] {
  const candidates = [answer, answer - 1, answer + 1, answer === 29 ? 28 : answer + 2]
    .map((value) => Math.max(1, Math.min(31, value)))
    .filter((value, index, values) => values.indexOf(value) === index);
  for (let value = 1; candidates.length < 4; value += 1) {
    if (!candidates.includes(value)) candidates.push(value);
  }
  return rotate(
    candidates.map((value) => ({ value, label: `${value}.` })),
    seed
  );
}

function answerHint(label: string, content: string): ProgressiveHint {
  return { id: 'answer', label, content, revealsAnswer: true };
}

function createWeekdayNumberingExercise(seed: number): DoomsdayExercise {
  const weekday = normalizedSeed(seed) % 7;
  const direction =
    Math.floor(normalizedSeed(seed) / 7) % 2 === 0 ? 'weekday-to-number' : 'number-to-weekday';
  const name = weekdayName(weekday);
  const weekdayToNumber = direction === 'weekday-to-number';
  return {
    id: `doomsday:weekday-numbering:${direction}:${weekday}:${normalizedSeed(seed)}`,
    learningUnitId: 'doomsday:weekday-numbering',
    discipline: 'doomsday',
    prompt: weekdayToNumber
      ? `Hvilket tal bruger vi for ${name}?`
      : `Hvilken ugedag har tallet ${weekday}?`,
    parameters: { skill: 'weekday-numbering', answer: weekday, direction },
    choices: weekdayToNumber ? numberedChoices(seed) : weekdayChoices(seed),
    visual: {
      label: weekdayToNumber ? 'Ugedag' : 'Ugedagstal',
      primary: weekdayToNumber ? name.slice(0, 3) : String(weekday),
      secondary: weekdayToNumber ? '→ ?' : '→ hvilken dag?',
    },
    explanation: `${capitalize(name)} har tallet ${weekday}. Rækken begynder med søndag som 0 og fortsætter til lørdag som 6.`,
    hints: [
      {
        id: 'start-at-sunday',
        label: 'Begynd ved søndag',
        content: 'Søndag er 0. Bevæg dig én plads og ét tal frem for hver dag.',
      },
      {
        id: 'week-ends',
        label: 'Brug enderne af ugen',
        content: 'Søndag er 0, mandag er 1, fredag er 5, og lørdag er 6.',
      },
      answerHint('Vis forbindelsen', `${capitalize(name)} = ${weekday}.`),
    ],
  };
}

function createCenturyAnchorExercise(seed: number): DoomsdayExercise {
  const centuryStart = pick([1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300], seed);
  const year = centuryStart + ((Math.floor(normalizedSeed(seed) / 8) % 99) + 1);
  const answer = centuryAnchor(year);
  const weekday = weekdayName(answer);
  return {
    id: `doomsday:century-anchors:${year}:${normalizedSeed(seed)}`,
    learningUnitId: 'doomsday:century-anchors',
    discipline: 'doomsday',
    prompt: `Hvad er århundredets anker for ${year}?`,
    parameters: { skill: 'century-anchors', answer, year },
    choices: weekdayChoices(seed),
    visual: {
      label: 'Århundrede',
      primary: `${centuryStart}`,
      secondary: `${centuryStart}–${centuryStart + 99}`,
    },
    explanation: `Årene ${centuryStart}–${centuryStart + 99} har ${weekday} som århundredeanker. Mønstret gentager sig for hver 400 år.`,
    hints: [
      {
        id: 'four-century-cycle',
        label: 'Tænk i en 400-årig cyklus',
        content:
          'Ankerdagene gentager sig efter fire århundreder. Derfor svarer 2200-tallet til 1800-tallet.',
      },
      {
        id: 'nearby-anchor',
        label: 'Tag udgangspunkt i 2000-tallet',
        content:
          '2000-tallet har tirsdag. Går du ét århundrede frem, bliver ankeret søndag; ét tilbage giver onsdag.',
      },
      answerHint('Vis ankeret', `Århundredets anker er ${weekday}.`),
    ],
  };
}

function createYearCalculationExercise(seed: number): DoomsdayExercise {
  const year = 1975 + (normalizedSeed(seed) % 26);
  const calculation = calculateDoomsday({ year, month: 4, day: 4 });
  const { dozen, remainder, quarterRemainder } = calculation.yearParts;
  const total = dozen + remainder + quarterRemainder;
  const shortTotal = total % 7;
  const answer = calculation.yearDoomsday;
  return {
    id: `doomsday:year-calculation:${year}:${normalizedSeed(seed)}`,
    learningUnitId: 'doomsday:year-calculation',
    discipline: 'doomsday',
    prompt: `Hvilken ugedag er dommedag i ${year}?`,
    parameters: { skill: 'year-calculation', answer, year },
    choices: weekdayChoices(seed),
    visual: {
      label: 'År',
      primary: String(year),
      secondary: `sidste to cifre: ${year % 100}`,
    },
    explanation: `${year % 100} bliver til ${dozen} + ${remainder} + ${quarterRemainder} = ${total}, altså ${shortTotal} skridt. Fra århundredets ${weekdayName(calculation.centuryAnchor)} lander du på ${weekdayName(answer)}.`,
    hints: [
      {
        id: 'year-groups',
        label: 'Del de sidste to cifre',
        content: `${year % 100} indeholder ${dozen} hele grupper på 12 og har ${remainder} i rest.`,
      },
      {
        id: 'leap-steps',
        label: 'Tilføj skudårsskridtene',
        content: `Der er ${quarterRemainder} hele grupper på fire i resten. Regn derfor ${dozen} + ${remainder} + ${quarterRemainder}.`,
      },
      {
        id: 'year-offset',
        label: 'Flyt fra århundredets anker',
        content: `Summen er ${total}. Fjern hele uger, så du kun skal ${shortTotal} skridt frem fra ${weekdayName(calculation.centuryAnchor)}.`,
      },
      answerHint('Vis årets dommedag', `Dommedag i ${year} er ${weekdayName(answer)}.`),
    ],
  };
}

function createMonthAnchorExercise(seed: number): DoomsdayExercise {
  const month = 1 + (normalizedSeed(seed) % 12);
  const year = Math.floor(normalizedSeed(seed) / 12) % 2 === 0 ? 2024 : 2025;
  const leap = calendar.isLeapYear(year);
  const answer = monthAnchorDay(month, leap);
  const currentMonthName = monthName(month - 1);
  return {
    id: `doomsday:month-anchors:${year}-${month}:${normalizedSeed(seed)}`,
    learningUnitId: 'doomsday:month-anchors',
    discipline: 'doomsday',
    prompt: `Hvilken dato er huskedatoen i ${currentMonthName} ${year}?`,
    parameters: { skill: 'month-anchors', answer, year, month, leap },
    choices: dayChoices(answer, seed),
    visual: {
      label: currentMonthName,
      primary: '?',
      secondary: leap ? `${year} · skudår` : String(year),
    },
    explanation: `${answer}. ${currentMonthName} er månedens huskedato i ${year} og falder derfor på årets dommedag.`,
    hints: [
      {
        id: 'even-or-pair',
        label: 'Find månedens familie',
        content:
          'Lige måneder bruger 4/4, 6/6, 8/8, 10/10 og 12/12. De skæve par er 9/5, 5/9, 11/7 og 7/11.',
      },
      {
        id: 'winter-exception',
        label: 'Husk vinterreglen',
        content: leap
          ? 'I et skudår bruger januar 4/1 og februar 29/2.'
          : 'I et almindeligt år bruger januar 3/1 og februar 28/2.',
      },
      answerHint('Vis huskedatoen', `Huskedatoen er ${answer}. ${currentMonthName}.`),
    ],
  };
}

function createLeapYearExercise(seed: number): DoomsdayExercise {
  const years = [1896, 1900, 1996, 2000, 2024, 2025, 2096, 2100, 2400] as const;
  const year = pick(years, seed);
  const leap = calendar.isLeapYear(year);
  return {
    id: `doomsday:leap-years:${year}:${normalizedSeed(seed)}`,
    learningUnitId: 'doomsday:leap-years',
    discipline: 'doomsday',
    prompt: `Er ${year} et skudår?`,
    parameters: { skill: 'leap-years', answer: leap ? 1 : 0, year, leap },
    choices: [
      { value: 1, label: 'Ja, skudår' },
      { value: 0, label: 'Nej, almindeligt år' },
    ],
    visual: {
      label: 'Skudår?',
      primary: String(year),
      secondary: 'februar har 28 eller 29 dage',
    },
    explanation: leap
      ? `${year} er et skudår. Januar bruger derfor 4/1 og februar 29/2 som huskedatoer.`
      : `${year} er ikke et skudår. Januar bruger derfor 3/1 og februar 28/2 som huskedatoer.`,
    hints: [
      {
        id: 'divisible-by-four',
        label: 'Prøv fireårsreglen',
        content: 'Et år er normalt skudår, hvis det kan deles med 4 uden rest.',
      },
      {
        id: 'century-exception',
        label: 'Kontrollér hele århundreder',
        content:
          'År, der ender på 00, skal kunne deles med 400. Derfor er 2000 skudår, mens 1900 og 2100 ikke er.',
      },
      answerHint('Vis svaret', `${year} er ${leap ? '' : 'ikke '}et skudår.`),
    ],
  };
}

export function createDateExercise(date: CalendarDate, seed = Date.now()): DoomsdayExercise {
  const calculation = calculateDoomsday(date);
  const weekday = weekdayName(calculation.weekday);
  const currentMonthName = monthName(date.month - 1);
  const centuryStart = Math.floor(date.year / 100) * 100;
  const yearSteps =
    calculation.yearParts.dozen +
    calculation.yearParts.remainder +
    calculation.yearParts.quarterRemainder;
  const shortYearSteps = yearSteps % 7;
  const shortDaySteps = Math.abs(calculation.dayOffset) % 7;
  return {
    id: `doomsday:complete-date:${date.year}-${date.month}-${date.day}:${normalizedSeed(seed)}`,
    learningUnitId: 'doomsday:complete-date',
    discipline: 'doomsday',
    prompt: `Hvilken ugedag var ${date.day}. ${currentMonthName} ${date.year}?`,
    parameters: { skill: 'complete-date', ...date, answer: calculation.weekday },
    choices: weekdayChoices(seed),
    visual: {
      label: currentMonthName,
      primary: String(date.day),
      secondary: String(date.year),
    },
    explanation: `${calculation.monthAnchorDay}. ${currentMonthName} falder på ${weekdayName(calculation.yearDoomsday)}. Måldatoen ligger ${Math.abs(calculation.dayOffset)} dage ${calculation.dayOffset < 0 ? 'før' : 'efter'}, så svaret er ${weekday}.`,
    hints: [
      {
        id: 'century',
        label: 'Start med århundredet',
        content: `Alle år fra ${centuryStart} til ${centuryStart + 99} bruger ${weekdayName(calculation.centuryAnchor)} som deres faste udgangspunkt.`,
      },
      {
        id: 'year-parts',
        label: 'Se på årets sidste to cifre',
        content: `${date.year % 100} rummer ${calculation.yearParts.dozen} hele grupper på 12 og ${calculation.yearParts.remainder} år i rest. Resten giver ${calculation.yearParts.quarterRemainder} ekstra skudårsdag. Det er ${yearSteps} skridt i alt — eller bare ${shortYearSteps}, når hele uger fjernes.`,
      },
      {
        id: 'year-doomsday',
        label: 'Find årets fælles ugedag',
        content: `Gå ${shortYearSteps} plads${shortYearSteps === 1 ? '' : 'er'} frem fra ${weekdayName(calculation.centuryAnchor)}. Du lander på ${weekdayName(calculation.yearDoomsday)}, som er årets dommedag.`,
      },
      {
        id: 'month-anchor',
        label: 'Brug månedens huskedato',
        content: `${calculation.monthAnchorDay}. ${currentMonthName} er månedens huskedato og falder derfor på ${weekdayName(calculation.yearDoomsday)}.`,
      },
      {
        id: 'offset',
        label: 'Gå hen til måldatoen',
        content: `${date.day}. ligger ${Math.abs(calculation.dayOffset)} dag${Math.abs(calculation.dayOffset) === 1 ? '' : 'e'} ${calculation.dayOffset < 0 ? 'før' : 'efter'} huskedatoen. Hele uger kan ignoreres, så gå ${shortDaySteps} plads${shortDaySteps === 1 ? '' : 'er'} ${calculation.dayOffset < 0 ? 'tilbage' : 'frem'} på ugehjulet.`,
      },
      answerHint('Vis svaret', `Svaret er ${weekday}.`),
    ],
  };
}

export function createDoomsdayExercise(
  skill: DoomsdaySkillId,
  seed = Date.now()
): DoomsdayExercise {
  if (skill === 'weekday-numbering') return createWeekdayNumberingExercise(seed);
  if (skill === 'century-anchors') return createCenturyAnchorExercise(seed);
  if (skill === 'year-calculation') return createYearCalculationExercise(seed);
  if (skill === 'month-anchors') return createMonthAnchorExercise(seed);
  if (skill === 'leap-years') return createLeapYearExercise(seed);
  return createDateExercise(generatedModernDate(seed), seed);
}

export function generatedModernDate(seed = Date.now()): CalendarDate {
  const value = normalizedSeed(seed);
  const yearSpan = 26;
  const year = 1975 + (value % yearSpan);
  const month = 1 + (Math.floor(value / yearSpan) % 12);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = 1 + (Math.floor(value / (yearSpan * 12)) % days);
  return { year, month, day };
}
