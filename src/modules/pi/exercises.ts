import type { GeneratedExercise } from '../../learning/types';
import { digits, followingDigits, PI_CONTENT_LIMIT, PI_DECIMALS } from './piData';

export type PiExerciseKind =
  | 'continue'
  | 'fill-gap'
  | 'prefix-run'
  | 'learn-chunk'
  | 'bridge'
  | 'random-access'
  | 'neighbour';
export type PiExercise = GeneratedExercise<{
  kind: PiExerciseKind;
  start: number;
  count: number;
  answer: string;
  context: string;
  direction?: 'before' | 'after';
}>;

export function createContinueExercise(start: number, count = 5): PiExercise {
  const contextStart = Math.max(1, start - 5);
  const contextCount = start - contextStart;
  const context = contextCount > 0 ? digits(contextStart, contextCount) : '';
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
  const afterCount = Math.min(4, PI_CONTENT_LIMIT - (start + count - 1));
  const after = afterCount > 0 ? followingDigits(start + count - 1, afterCount) : '';
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

export function createChunkExercise(start: number, count = 5): PiExercise {
  const answer = digits(start, count);
  const contextStart = Math.max(1, start - 5);
  const contextCount = start - contextStart;
  return {
    id: `pi:chunk:${start}:${count}`,
    learningUnitId: `pi:chunk:${start}-${start + count - 1}`,
    discipline: 'pi',
    prompt: `Skriv den nye blok fra position ${start}–${start + count - 1}.`,
    parameters: {
      kind: 'learn-chunk',
      start,
      count,
      answer,
      context: contextCount > 0 ? digits(contextStart, contextCount) : '',
    },
    hints: [
      { id: 'first', label: 'Første ciffer', content: answer[0]! },
      { id: 'rhythm', label: 'Se rytmen', content: `${answer.slice(0, 2)} · ${answer.slice(2)}` },
      { id: 'answer', label: 'Vis hele blokken', content: answer, revealsAnswer: true },
    ],
  };
}

export function createBridgeExercise(start: number, count = 5): PiExercise {
  const exercise = createContinueExercise(start, count);
  return {
    ...exercise,
    id: `pi:bridge:${start}:${count}`,
    learningUnitId: `pi:bridge:${start}-${start + count - 1}`,
    parameters: { ...exercise.parameters, kind: 'bridge' },
    prompt: `Kryds blokgrænsen ved position ${start}–${start + count - 1}.`,
  };
}

export function createRandomAccessExercise(start: number, count = 5): PiExercise {
  const exercise = createFillGapExercise(start, count);
  return {
    ...exercise,
    id: `pi:random:${start}:${count}`,
    learningUnitId: `pi:random-access:${start}-${start + count - 1}`,
    parameters: { ...exercise.parameters, kind: 'random-access' },
    prompt: `Find blokken direkte ved position ${start}–${start + count - 1}.`,
  };
}

export function createNeighbourExercise(
  anchorPosition: number,
  direction: 'before' | 'after'
): PiExercise {
  const count = 2;
  const start = direction === 'before' ? anchorPosition - count : anchorPosition + 3;
  const anchor = digits(anchorPosition, 3);
  const answer = digits(start, count);
  return {
    id: `pi:neighbour:${direction}:${anchorPosition}`,
    learningUnitId: `pi:neighbour:${direction}:${anchorPosition}`,
    discipline: 'pi',
    prompt: `Hvilke to cifre står lige ${direction === 'before' ? 'før' : 'efter'} ${anchor}?`,
    parameters: {
      kind: 'neighbour',
      start,
      count,
      answer,
      context: direction === 'before' ? `__${anchor}` : `${anchor}__`,
      direction,
    },
    hints: [
      { id: 'first', label: 'Første ciffer', content: answer[0]! },
      { id: 'answer', label: 'Vis begge', content: answer, revealsAnswer: true },
    ],
  };
}

export function createPrefixRunExercise(limit = PI_CONTENT_LIMIT): PiExercise {
  return {
    id: `pi:prefix-run:1-${limit}`,
    learningUnitId: 'pi:prefix-diagnostic',
    discipline: 'pi',
    prompt: 'Hvor langt kan du fortsætte fra 3 komma?',
    parameters: {
      kind: 'prefix-run',
      start: 1,
      count: limit,
      answer: PI_DECIMALS.slice(0, limit),
      context: '',
    },
    hints: [],
  };
}

export const piDiagnosticPrompts = [
  createContinueExercise(6, 5),
  createContinueExercise(16, 5),
  createContinueExercise(26, 5),
  createFillGapExercise(11, 5),
  createFillGapExercise(24, 5),
];

export interface PiAnswerEvaluation {
  normalized: string;
  correctDigits: number;
  totalDigits: number;
  complete: boolean;
  matches: boolean[];
}

export function evaluatePiAnswer(value: string, expected: string): PiAnswerEvaluation {
  const normalized = value.replace(/\D/g, '');
  const matches = [...expected].map((digit, index) => normalized[index] === digit);
  return {
    normalized,
    correctDigits: matches.filter(Boolean).length,
    totalDigits: expected.length,
    complete: normalized === expected,
    matches,
  };
}

export function isPiAnswer(value: string, expected: string): boolean {
  return evaluatePiAnswer(value, expected).complete;
}

export function learnedTerritory(attemptedThrough: number): {
  learned: string;
  newTerritory: string;
} {
  const boundary = Math.max(0, Math.min(PI_CONTENT_LIMIT, attemptedThrough));
  return {
    learned: PI_DECIMALS.slice(0, boundary),
    newTerritory: PI_DECIMALS.slice(boundary),
  };
}
