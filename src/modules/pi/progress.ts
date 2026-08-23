import type { Attempt, MasteryRecord } from '../../learning/types';
import { INITIAL_PI_FAMILIARITY, PI_CONTENT_LIMIT } from './piData';

const CHUNK_SIZE = 5;
const LEARNED_STRENGTH = 0.68;

export interface PiLearningProfile {
  workingBoundary: number;
  verifiedPrefix: number;
  nextChunkStart: number | null;
  nextChunkEnd: number | null;
  visibleThrough: number;
  milestone: number;
}

function recordedPrefix(attempts: Attempt[]): number {
  return attempts.reduce((highest, attempt) => {
    if (attempt.learningUnitId !== 'pi:prefix-diagnostic') return highest;
    const value = attempt.generatedParameters.correctDigits;
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
}

function learnedChunkBoundary(mastery: MasteryRecord[], startingBoundary: number): number {
  const strengthById = new Map(mastery.map((record) => [record.learningUnitId, record.strength]));
  let boundary = startingBoundary;
  while (boundary < PI_CONTENT_LIMIT) {
    const start = boundary + 1;
    const end = Math.min(PI_CONTENT_LIMIT, boundary + CHUNK_SIZE);
    if ((strengthById.get(`pi:chunk:${start}-${end}`) ?? 0) < LEARNED_STRENGTH) break;
    boundary = end;
  }
  return boundary;
}

export function piLearningProfile(
  attempts: Attempt[],
  mastery: MasteryRecord[]
): PiLearningProfile {
  const verifiedPrefix = recordedPrefix(attempts);
  const diagnosedBoundary = Math.floor(verifiedPrefix / CHUNK_SIZE) * CHUNK_SIZE;
  const startingBoundary = Math.max(INITIAL_PI_FAMILIARITY, diagnosedBoundary);
  const workingBoundary = learnedChunkBoundary(mastery, startingBoundary);
  const nextChunkStart = workingBoundary < PI_CONTENT_LIMIT ? workingBoundary + 1 : null;
  const nextChunkEnd = nextChunkStart
    ? Math.min(PI_CONTENT_LIMIT, nextChunkStart + CHUNK_SIZE - 1)
    : null;
  const nextHundred = Math.ceil((workingBoundary + 1) / 100) * 100;

  return {
    workingBoundary,
    verifiedPrefix,
    nextChunkStart,
    nextChunkEnd,
    visibleThrough: Math.min(PI_CONTENT_LIMIT, workingBoundary + CHUNK_SIZE),
    milestone: Math.min(PI_CONTENT_LIMIT, Math.max(100, nextHundred)),
  };
}

export function selectKnownWindow(boundary: number, seed: number, count = 5): number {
  const lastStart = Math.max(1, boundary - count + 1);
  const chunkCount = Math.max(1, Math.floor((lastStart - 1) / CHUNK_SIZE) + 1);
  return 1 + (Math.abs(Math.trunc(seed)) % chunkCount) * CHUNK_SIZE;
}

export function selectBridgeWindow(boundary: number, seed: number, count = 5): number {
  const availableBoundaries = Array.from(
    { length: Math.max(1, Math.floor(boundary / CHUNK_SIZE) - 1) },
    (_, index) => (index + 1) * CHUNK_SIZE
  ).filter((chunkBoundary) => chunkBoundary >= 5 && chunkBoundary + 2 <= boundary);
  const crossing =
    availableBoundaries[Math.abs(Math.trunc(seed)) % availableBoundaries.length] ?? 5;
  return Math.max(1, crossing - Math.floor(count / 2) + 1);
}
