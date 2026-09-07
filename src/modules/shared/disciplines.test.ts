import { it, expect } from 'vitest';
import { elements, song, elementUnits, elementExercise, gridPosition } from '../elements/domain';
import { codes, kochConfig, kochCount, scoreTaps } from '../morse/domain';
import { compareIpa, ipaSegments, phoneticsUnits } from '../phonetics/domain';
import { pythonCorpus, pythonUnits, outputMatches } from '../python_output/domain';
import { learningCatalog, disciplineForLearningUnitId } from '../../learning/sessions/catalog';
import { selectDailySession } from '../../learning/sessions/sessionSelector';
import { createAttempt } from '../../learning/attempts';
import { masteryForAttempt } from '../../learning/mastery';
import { rebuildLearningState } from '../../sync/merge';
it('has 118 unique chemical records and 102 distinct original song positions', () => {
  expect(elements).toHaveLength(118);
  expect(elements.map((e) => e.atomicNumber)).toEqual(Array.from({ length: 118 }, (_, i) => i + 1));
  expect(new Set(elements.map((e) => e.symbol)).size).toBe(118);
  expect(new Set(elements.map((e) => gridPosition(e).join(':'))).size).toBe(118);
  expect(song).toHaveLength(102);
  expect(song[0]!.symbol).toBe('Sb');
  expect(song[36]!.symbol).toBe('B');
  expect(song.at(-1)!.symbol).toBe('Na');
  expect(elements.filter((e) => e.songIndex === null).map((e) => e.atomicNumber)).toEqual(
    Array.from({ length: 16 }, (_, i) => i + 103)
  );
  for (const u of elementUnits) expect(elementExercise(u).answer).toBeTruthy();
});
it('keeps song chains non-cyclic and accepts Danish and English element names', () => {
  expect(elementUnits.find((u) => u.id === 'elements:song_chain:11')).toBeUndefined();
  const u = elementUnits.find((u) => u.id === 'elements:symbol_to_name:26')!;
  expect(elementExercise(u).accepted).toEqual(['jern', 'iron']);
});
it('starts Koch at two and requires strictly over 90 percent clean recent recall', () => {
  expect(kochCount([])).toBe(2);
  expect(new Set(kochConfig.order).size).toBe(36);
  expect(Object.keys(codes)).toHaveLength(36);
  const attempts = Array.from({ length: 30 }, (_, i) =>
    createAttempt(
      {
        id: String(i),
        learningUnitId: `morse:receive:${i % 2 ? 'K' : 'M'}`,
        discipline: 'morse',
        prompt: '',
        parameters: { mode: 'receive', character: i % 2 ? 'K' : 'M' },
        hints: [],
      },
      { correct: i >= 3, responseTimeMs: 900, hintsUsed: 0, answerRevealed: false, grade: 'good' }
    )
  );
  expect(kochCount(attempts)).toBe(2);
  attempts[0]!.correct = true;
  expect(kochCount(attempts)).toBe(3);
  attempts.forEach((a) => (a.hintsUsed = 1));
  expect(kochCount(attempts)).toBe(2);
});
it('scores Morse relative duration, spacing and incomplete taps', () => {
  expect(
    scoreTaps(
      [
        { down: 0, up: 180 },
        { down: 240, up: 300 },
        { down: 360, up: 540 },
      ],
      '-.-'
    ).correct
  ).toBe(true);
  expect(
    scoreTaps(
      [
        { down: 0, up: 180 },
        { down: 800, up: 860 },
        { down: 920, up: 1100 },
      ],
      '-.-'
    ).correct
  ).toBe(false);
  expect(scoreTaps([], '.').correct).toBe(false);
});
it('compares normalized phonetic segments with diagnostic operations', () => {
  expect(ipaSegments('t͡ʃa')).toEqual(['t͡ʃ', 'a']);
  expect(compareIpa('ã', 'ã').correct).toBe(true);
  expect(compareIpa('i', 'u').substitutions).toEqual(['i → u']);
  expect(compareIpa('ia', 'i').insertions).toBe(1);
  expect(compareIpa('i', 'ia').deletions).toBe(1);
  expect(compareIpa('', 'i').partialCredit).toBe(0);
});
it('gates vowel spectrograms on class mastery in the shared selector', () => {
  const units = phoneticsUnits.filter((u) => u.id.includes('spectrogram_vowel'));
  expect(units).toHaveLength(6);
  expect(
    selectDailySession({
      catalog: units,
      scheduled: [],
      mastery: [],
      recentSessions: [],
      focusWeights: {},
    })
  ).toEqual([]);
});
it('keeps Python stdout whitespace meaningful and corpus nontrivial/versioned', () => {
  expect(pythonUnits.length).toBeGreaterThanOrEqual(40);
  expect(pythonCorpus.runsPerSnippet).toBe(3);
  expect(outputMatches('x\n', 'x')).toBe(true);
  expect(outputMatches(' x', 'x')).toBe(false);
  expect(outputMatches('x\n\n', 'x')).toBe(false);
  for (const s of pythonCorpus.snippets) {
    expect(s.code.trimEnd().split('\n').length).toBeGreaterThanOrEqual(3);
    expect(s.code.trimEnd().split('\n').length).toBeLessThanOrEqual(8);
    expect(s.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
  }
});
it('registers stable identities and uses identical live/replayed mastery', () => {
  expect(new Set(learningCatalog.map((u) => u.id)).size).toBe(learningCatalog.length);
  for (const u of learningCatalog) expect(disciplineForLearningUnitId(u.id)).toBe(u.discipline);
  const attempt = createAttempt(
    {
      id: 'x',
      learningUnitId: 'flashcards:conversion:skill:F-to-C',
      discipline: 'flashcards',
      prompt: '',
      parameters: { learningStage: 'unassisted' },
      hints: [],
    },
    { correct: true, responseTimeMs: 10000, hintsUsed: 0, answerRevealed: false, grade: 'easy' }
  );
  expect(masteryForAttempt(attempt)).toEqual(rebuildLearningState([attempt]).mastery[0]);
  expect(masteryForAttempt(attempt).stage).toBe('fluent');
});

it('can unlock the full 36-character Koch set when sufficient recent evidence covers it', () => {
  const attempts = Array.from({ length: 36 * 40 }, (_, i) => {
    const character = kochConfig.order[i % 36]!;
    return createAttempt(
      {
        id: String(i),
        learningUnitId: `morse:receive:${character}`,
        discipline: 'morse',
        prompt: '',
        parameters: { mode: 'receive', character },
        hints: [],
      },
      { correct: true, responseTimeMs: 900, hintsUsed: 0, answerRevealed: false, grade: 'good' },
      new Date(1700000000000 + i * 1000)
    );
  });
  expect(kochCount(attempts)).toBe(36);
});
