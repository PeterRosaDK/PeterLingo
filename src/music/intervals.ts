export interface IntervalExample {
  rootMidi: number;
  semitones: number;
  direction: 'ascending' | 'descending' | 'harmonic';
  targetMidi: number;
}

export const INTERVALS = {
  P1: 0,
  m2: 1,
  M2: 2,
  m3: 3,
  M3: 4,
  P4: 5,
  TT: 6,
  P5: 7,
  m6: 8,
  M6: 9,
  m7: 10,
  M7: 11,
  P8: 12,
} as const;

export function createIntervalExample(
  rootMidi: number,
  semitones: number,
  direction: IntervalExample['direction']
): IntervalExample {
  if (semitones < 0 || semitones > 12)
    throw new RangeError('Intervallet skal være 0–12 halvtoner.');
  return {
    rootMidi,
    semitones,
    direction,
    targetMidi: direction === 'descending' ? rootMidi - semitones : rootMidi + semitones,
  };
}
