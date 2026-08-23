import type { MasteryRecord } from '../../learning/types';

export type IntervalPresentation = 'ascending' | 'descending' | 'harmonic';

export const EAR_CURRICULUM_VERSION = 1;

export interface EarInterval {
  id: 'm3' | 'M3' | 'P4' | 'P5';
  name: string;
  semitones: number;
  description: string;
}

export const EAR_INTERVALS: EarInterval[] = [
  {
    id: 'm3',
    name: 'Lille terts',
    semitones: 3,
    description: 'Tre halvtoner. En anelse smallere end den store terts.',
  },
  {
    id: 'M3',
    name: 'Stor terts',
    semitones: 4,
    description: 'Fire halvtoner. Lyt efter den lille ekstra åbning.',
  },
  {
    id: 'P4',
    name: 'Ren kvart',
    semitones: 5,
    description: 'Fem halvtoner. Mere åben end tertserne.',
  },
  {
    id: 'P5',
    name: 'Ren kvint',
    semitones: 7,
    description: 'Syv halvtoner. Det bredeste af de første fire intervaller.',
  },
];

export const INTERVAL_PRESENTATIONS: IntervalPresentation[] = [
  'ascending',
  'descending',
  'harmonic',
];

export function presentationLabel(presentation: IntervalPresentation): string {
  if (presentation === 'ascending') return 'melodisk opad';
  if (presentation === 'descending') return 'melodisk nedad';
  return 'harmonisk';
}

export function intervalLearningUnitId(
  interval: EarInterval,
  presentation: IntervalPresentation
): string {
  return `music-ear:interval:${interval.semitones}:${presentation}`;
}

function strengthFor(
  mastery: MasteryRecord[],
  interval: EarInterval,
  presentation: IntervalPresentation
): number {
  return (
    mastery.find(
      (record) => record.learningUnitId === intervalLearningUnitId(interval, presentation)
    )?.strength ?? 0
  );
}

export function selectIntervalForPresentation(
  mastery: MasteryRecord[],
  presentation: IntervalPresentation,
  seed: number
): EarInterval {
  const offset = Math.abs(seed) % EAR_INTERVALS.length;
  const rotated = [...EAR_INTERVALS.slice(offset), ...EAR_INTERVALS.slice(0, offset)];
  return rotated.reduce((weakest, interval) =>
    strengthFor(mastery, interval, presentation) < strengthFor(mastery, weakest, presentation)
      ? interval
      : weakest
  );
}
