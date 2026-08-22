import { describe, expect, it } from 'vitest';
import { BASS, CELLO, GUITAR, pianoMidiRange, pitchAt } from './instruments';
import { createIntervalExample } from './intervals';
import { midiToFrequency, noteName, pitchClass } from './pitch';

describe('music domain', () => {
  it('converts MIDI and pitch classes', () => {
    expect(pitchClass(60)).toBe(0);
    expect(midiToFrequency(69)).toBeCloseTo(440);
  });

  it('supports Danish and international B naming', () => {
    expect(noteName(71, 'danish')).toBe('H4');
    expect(noteName(70, 'danish', true)).toBe('B4');
    expect(noteName(71, 'international')).toBe('B4');
    expect(noteName(70, 'international', true)).toBe('B♭4');
  });

  it('maps standard guitar, bass, and cello tunings', () => {
    expect(GUITAR.openStrings.map((midi) => noteName(midi))).toEqual([
      'E2',
      'A2',
      'D3',
      'G3',
      'H3',
      'E4',
    ]);
    expect(BASS.openStrings.map((midi) => noteName(midi))).toEqual(['E1', 'A1', 'D2', 'G2']);
    expect(CELLO.openStrings.map((midi) => noteName(midi))).toEqual(['C2', 'G2', 'D3', 'A3']);
    expect(CELLO.fretless).toBe(true);
    expect(pitchAt(GUITAR, 0, 1)).toBe(41);
  });

  it('builds a complete piano range and generated interval', () => {
    expect(pianoMidiRange(60, 72)).toHaveLength(13);
    expect(createIntervalExample(60, 3, 'descending')).toMatchObject({ targetMidi: 57 });
  });
});
