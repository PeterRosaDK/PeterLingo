export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export interface CalendarSystem {
  readonly id: string;
  isLeapYear(year: number): boolean;
  weekday(date: CalendarDate): number;
}

export const mod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;
