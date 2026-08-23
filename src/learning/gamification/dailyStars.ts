import type { Attempt, DisciplineId } from '../types';

export const DAILY_STAR_TARGET = 3;

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function attemptsOnDay(attempts: Attempt[], day = new Date()): Attempt[] {
  const key = localDayKey(day);
  return attempts.filter((attempt) => localDayKey(new Date(attempt.attemptedAt)) === key);
}

export function dailyStars(
  attempts: Attempt[],
  discipline: DisciplineId,
  day = new Date()
): number {
  return Math.min(
    DAILY_STAR_TARGET,
    attemptsOnDay(attempts, day).filter((attempt) => attempt.discipline === discipline).length
  );
}

export function dailyStarTotal(attempts: Attempt[], day = new Date()): number {
  const disciplines: DisciplineId[] = ['doomsday', 'roux', 'cards', 'pi', 'music-ear'];
  return disciplines.reduce((sum, discipline) => sum + dailyStars(attempts, discipline, day), 0);
}
