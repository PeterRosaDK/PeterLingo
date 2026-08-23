import type { GeneratedExercise, MasteryRecord } from '../../learning/types';
import { createIntervalExample } from '../../music/intervals';
import {
  EAR_INTERVALS,
  INTERVAL_PRESENTATIONS,
  intervalLearningUnitId,
  presentationLabel,
  selectIntervalForPresentation,
  type EarInterval,
  type IntervalPresentation,
} from './curriculum';

export type EarExercise = GeneratedExercise<{
  rootMidi: number;
  targetMidi: number;
  semitones: number;
  intervalId: EarInterval['id'];
  answer: string;
  presentation: IntervalPresentation;
  harmonic: boolean;
}>;

function rootFor(presentation: IntervalPresentation, seed: number): number {
  const offset = Math.abs(seed) % 8;
  return presentation === 'descending' ? 67 + offset : 55 + offset;
}

export function createEarExercise(
  interval: EarInterval,
  presentation: IntervalPresentation,
  seed: number
): EarExercise {
  const example = createIntervalExample(
    rootFor(presentation, seed),
    interval.semitones,
    presentation
  );
  return {
    id: `ear:${presentation}:${interval.id}:${example.rootMidi}:${Math.abs(seed)}`,
    learningUnitId: intervalLearningUnitId(interval, presentation),
    discipline: 'music-ear',
    prompt: `Hvilket interval hører du ${presentationLabel(presentation)}?`,
    parameters: {
      rootMidi: example.rootMidi,
      targetMidi: example.targetMidi,
      semitones: interval.semitones,
      intervalId: interval.id,
      answer: interval.name,
      presentation,
      harmonic: presentation === 'harmonic',
    },
    hints: [
      {
        id: 'presentation',
        label: 'Lyt på denne måde',
        content:
          presentation === 'harmonic'
            ? 'Prøv at skille den nederste og øverste tone ad inde i klangen.'
            : 'Hold den første tone i hukommelsen, mens den anden lyder.',
      },
      {
        id: 'family',
        label: 'Intervalfamilie',
        content:
          interval.semitones <= 4 ? 'Afstanden er en terts.' : 'Afstanden er større end en terts.',
      },
      { id: 'answer', label: 'Vis svaret', content: interval.name, revealsAnswer: true },
    ],
  };
}

export function buildDailyEarRound(mastery: MasteryRecord[], seed: number): EarExercise[] {
  const rotation = Math.abs(seed) % INTERVAL_PRESENTATIONS.length;
  const presentations = [
    ...INTERVAL_PRESENTATIONS.slice(rotation),
    ...INTERVAL_PRESENTATIONS.slice(0, rotation),
  ];
  return presentations.map((presentation, index) => {
    const exerciseSeed = seed + index * 7_919;
    return createEarExercise(
      selectIntervalForPresentation(mastery, presentation, exerciseSeed),
      presentation,
      exerciseSeed
    );
  });
}

export const earAnswerOptions = EAR_INTERVALS.map((interval) => interval.name);
