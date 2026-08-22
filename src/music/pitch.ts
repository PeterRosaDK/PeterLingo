export type NoteNaming = 'danish' | 'international';

const INTERNATIONAL_SHARPS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const DANISH_SHARPS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'H'];
const INTERNATIONAL_FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const DANISH_FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B', 'H'];

export function pitchClass(midi: number): number {
  if (!Number.isInteger(midi)) throw new TypeError('MIDI-tonen skal være et helt tal.');
  return ((midi % 12) + 12) % 12;
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function noteName(
  midi: number,
  naming: NoteNaming = 'danish',
  preferFlats = false,
  includeOctave = true
): string {
  const names = preferFlats
    ? naming === 'danish'
      ? DANISH_FLATS
      : INTERNATIONAL_FLATS
    : naming === 'danish'
      ? DANISH_SHARPS
      : INTERNATIONAL_SHARPS;
  const octave = Math.floor(midi / 12) - 1;
  return `${names[pitchClass(midi)]}${includeOctave ? octave : ''}`;
}
