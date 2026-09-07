import { expect, it } from 'vitest';
import { parseSongTimestamps, songClip } from './songAudio';
it('validates sparse recording-specific timestamps and bounds clips', () => {
  expect(parseSongTimestamps({ '1': 0, '37': 12345 })).toEqual({ '1': 0, '37': 12345 });
  expect(songClip({ '1': 0, '2': 1800 }, 1)).toEqual({ start: 0, end: 1.8 });
  expect(songClip({ '37': 10000 }, 37)).toEqual({ start: 10, end: 14 });
  expect(songClip({}, 37)).toBeNull();
  for (const value of [[], { '103': 0 }, { '1': -1 }, { '2': '1000' }])
    expect(() => parseSongTimestamps(value)).toThrow();
});
