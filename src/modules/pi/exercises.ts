import type { GeneratedExercise } from '../../learning/types';
import { digits, followingDigits, PI_100 } from './piData';

export type PiExerciseKind = 'continue' | 'fill-gap' | 'prefix-run';
export type PiExercise = GeneratedExercise<{
  kind: PiExerciseKind;
  start: number;
  count: number;
  answer: string;
  context: string;
}>;

export function createContinueExercise(start: number, count = 5): PiExercise {
  const contextStart = Math.max(1, start - 5);
  const context = digits(contextStart, start - contextStart);
  const answer = digits(start, count);
  return {
    id: `pi:continue:${start}:${count}`,
    learningUnitId: `pi:transition:${Math.max(1, start - 1)}-${start}`,
    discipline: 'pi',
    prompt: `Fortsæt med ${count} cifre fra position ${start}.`,
    parameters: { kind: 'continue', start, count, answer, context },
    hints: [
      { id: 'first', label: 'Første ciffer', content: `Det første ciffer er ${answer[0]}.` },
      { id: 'shape', label: 'Del rytmen', content: `${answer.slice(0, 2)} · ${answer.slice(2)}` },
      { id: 'answer', label: 'Vis svaret', content: answer, revealsAnswer: true },
    ],
  };
}

export function createFillGapExercise(start: number, count = 5): PiExercise {
  const beforeStart = Math.max(1, start - 4);
  const before = digits(beforeStart, start - beforeStart);
  const answer = digits(start, count);
  const after = followingDigits(start + count - 1, Math.min(4, 100 - (start + count - 1)));
  const context = `${before}_____${after}`;
  return {
    id: `pi:gap:${start}:${count}`,
    learningUnitId: `pi:window:${start}-${start + count - 1}`,
    discipline: 'pi',
    prompt: `Udfyld hullet ved position ${start}–${start + count - 1}.`,
    parameters: { kind: 'fill-gap', start, count, answer, context },
    hints: [
      { id: 'first-two', label: 'De første to', content: answer.slice(0, 2) },
      { id: 'answer', label: 'Vis hele blokken', content: answer, revealsAnswer: true },
    ],
  };
}

export function createPrefixRunExercise(): PiExercise {
  return {
    id: 'pi:prefix-run:1-100',
    learningUnitId: 'pi:prefix-fluency',
    discipline: 'pi',
    prompt: 'Hvor langt kan du fortsætte fra 3 komma?',
    parameters: {
      kind: 'prefix-run',
      start: 1,
      count: 100,
      answer: PI_100,
      context: '',
    },
    hints: [],
  };
}

export const piDiagnosticPrompts = [
  createContinueExercise(16, 5),
  createContinueExercise(26, 5),
  createFillGapExercise(11, 5),
  createFillGapExercise(24, 5),
];

export function isPiAnswer(value: string, expected: string): boolean {
  return value.replace(/\D/g, '') === expected;
}

export function learnedTerritory(attemptedThrough: number): {
  learned: string;
  newTerritory: string;
} {
  const boundary = Math.max(0, Math.min(100, attemptedThrough));
  return { learned: PI_100.slice(0, boundary), newTerritory: PI_100.slice(boundary) };
}
