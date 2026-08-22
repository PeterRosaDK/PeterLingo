export interface StringedInstrumentDefinition {
  id: 'guitar' | 'bass' | 'cello';
  openStrings: readonly number[];
  fretless: boolean;
  defaultVisiblePositions: number;
}

export const GUITAR: StringedInstrumentDefinition = {
  id: 'guitar',
  openStrings: [40, 45, 50, 55, 59, 64],
  fretless: false,
  defaultVisiblePositions: 12,
};
export const BASS: StringedInstrumentDefinition = {
  id: 'bass',
  openStrings: [28, 33, 38, 43],
  fretless: false,
  defaultVisiblePositions: 12,
};
export const CELLO: StringedInstrumentDefinition = {
  id: 'cello',
  openStrings: [36, 43, 50, 57],
  fretless: true,
  defaultVisiblePositions: 12,
};

export function pitchAt(
  definition: StringedInstrumentDefinition,
  stringIndex: number,
  semitones: number
): number {
  const open = definition.openStrings[stringIndex];
  if (open === undefined || semitones < 0 || !Number.isInteger(semitones))
    throw new RangeError('Ugyldig streng eller position.');
  return open + semitones;
}

export function pianoMidiRange(from = 48, to = 72): number[] {
  if (from > to) throw new RangeError('Klaverets starttone skal komme før sluttone.');
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}
