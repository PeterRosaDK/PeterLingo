import manifest from './manifest.json';
import { recall, unit } from '../shared/recall';
import type { LearningUnit } from '../../learning/types';
export const phoneticsManifest = manifest;
export const ipaInventories = {
  da: [
    'i',
    'e',
    'ɛ',
    'a',
    'ɑ',
    'ɒ',
    'ɔ',
    'o',
    'u',
    'y',
    'ø',
    'œ',
    'ɶ',
    'ə',
    'ɐ',
    'ð',
    'ʁ',
    'ŋ',
    'ɕ',
    'p',
    't',
    'k',
    's',
    'ˈ',
    'ː',
    'ʰ',
    '̰',
  ],
  en: [
    'i',
    'ɪ',
    'e',
    'ɛ',
    'æ',
    'ɑ',
    'ɒ',
    'ɔ',
    'ʊ',
    'u',
    'ʌ',
    'ə',
    'ɜ',
    'θ',
    'ð',
    'ʃ',
    'ʒ',
    'ŋ',
    'ɹ',
    't͡ʃ',
    'd͡ʒ',
    'ˈ',
    'ː',
  ],
};
export function ipaSegments(input: string): string[] {
  const chars = [
    ...input
      .normalize('NFD')
      .trim()
      .replace(/^[[/]|[\]/]$/g, '')
      .replace(/\s+/g, ''),
  ];
  const segments: string[] = [];
  let tied = false;
  for (const c of chars) {
    if (c === '͡' || c === '͜') {
      if (segments.length) segments[segments.length - 1] += c;
      tied = true;
    } else if ((/\p{M}/u.test(c) || tied) && segments.length) {
      segments[segments.length - 1] += c;
      tied = false;
    } else segments.push(c);
  }
  return segments;
}
export function compareIpa(actual: string, expected: string) {
  const a = ipaSegments(actual),
    b = ipaSegments(expected);
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i]![0] = i;
  for (let j = 0; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  let i = a.length,
    j = b.length;
  const substitutions: string[] = [];
  let insertions = 0,
    deletions = 0;
  while (i || j) {
    if (i && j && dp[i]![j] === dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      if (a[i - 1] !== b[j - 1]) substitutions.push(`${a[i - 1]} → ${b[j - 1]}`);
      i--;
      j--;
    } else if (i && dp[i]![j] === dp[i - 1]![j]! + 1) {
      insertions++;
      i--;
    } else {
      deletions++;
      j--;
    }
  }
  const distance = dp[a.length]![b.length]!;
  return {
    correct: distance === 0,
    distance,
    substitutions,
    insertions,
    deletions,
    partialCredit: Math.max(0, 1 - distance / Math.max(a.length, b.length, 1)),
  };
}
export const phoneticsUnits = manifest.flatMap((r) => [
  unit(`spectrogram_read:${r.id}`, 'phonetics', 'Spektrogram · lydklasse', 35),
  ...(r.class === 'vokal'
    ? [unit(`ipa_transcribe:${r.id}`, 'phonetics', `IPA · ${r.language} · lydprototype`, 35)]
    : []),
]);
export const vowelSpectrogramUnits = manifest
  .filter((r) => r.class === 'vokal')
  .map((r) => ({
    ...unit(`spectrogram_vowel:${r.id}`, 'phonetics', 'Spektrogram · /i a u/', 35),
    prerequisites: manifest.map((p) => `phonetics:spectrogram_read:${p.id}`),
  }));
phoneticsUnits.push(...vowelSpectrogramUnits);
export function phoneticsExercise(u: LearningUnit) {
  const [, mode, id] = u.id.split(':');
  const r = manifest.find((r) => r.id === id)!;
  const spec = mode?.startsWith('spectrogram');
  const target = mode === 'spectrogram_vowel' ? r.ipa : r.class;
  return recall(
    u,
    spec
      ? mode === 'spectrogram_vowel'
        ? 'Læs spektrogrammet: skriv i, a eller u'
        : 'Læs spektrogrammet: skriv vokal, frikativ eller plosiv'
      : 'Lyt til den syntetiske IPA-prototype',
    spec ? target : r.ipa,
    r.cue,
    {
      kind: spec ? 'spectrogram' : 'ipa',
      media: spec ? r.image : r.audio,
      parameters: {
        mode,
        id,
        language: r.language,
        audio: r.audio,
        tier: mode === 'spectrogram_vowel' ? 2 : spec ? 1 : r.tier,
        synthetic: r.synthetic,
      },
      hints: [
        { id: 'cue', label: 'Visuelt/lydligt kendetegn', content: r.cue },
        { id: 'answer', label: 'Facit', content: spec ? target : r.ipa, revealsAnswer: true },
      ],
    }
  );
}
