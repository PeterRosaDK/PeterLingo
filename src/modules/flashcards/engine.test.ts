import { describe, it, expect } from 'vitest';
import {
  decks,
  flashcardUnits,
  hskWords,
  hskDeck,
  deckSelection,
  countryDeck,
  conversionDeck,
  conversions,
  flashcardEnabled,
} from './engine';
import { createEmptySnapshot } from '../../persistence/types';
import { gradeSelfRecall, selfRatings } from '../../learning/fsrs/selfRating';
import { FsrsScheduler } from '../../learning/fsrs/scheduler';
import { sessionEligibility } from '../../learning/sessions/eligibility';
import { selectDailySession, resolveLearningUnits } from '../../learning/sessions/sessionSelector';
import { InMemoryLearningRepository } from '../../persistence/inMemoryRepository';
import { parseSnapshot } from '../../persistence/validation';
describe('generic flashcard contract', () => {
  it('registers unique decks and separate direction-specific units', () => {
    expect(decks.map((d) => d.id)).toEqual(['hsk', 'countries', 'conversion']);
    expect(new Set(flashcardUnits.map((u) => u.id)).size).toBe(flashcardUnits.length);
    const ids = flashcardUnits.filter((u) => u.deckId === 'hsk' && u.recordId === hskWords[0]!.id);
    expect(ids).toHaveLength(6);
    const scheduler = new FsrsScheduler();
    expect(scheduler.review(scheduler.create(ids[0]!.id), 'good').reps).toBe(1);
    expect(scheduler.create(ids[1]!.id).reps).toBe(0);
  });
  it('uses static country data and real Unicode regional flag pairs', () => {
    const units = countryDeck.getLearningUnits().filter((u) => u.recordId === 'PT');
    const cards = units.map((u) => countryDeck.generateCard(u, { random: () => 0, difficulty: 0 }));
    expect(cards.map((c) => c.front.text)).toEqual(['Portugal', 'Lissabon', '🇵🇹']);
    expect(cards.map((c) => c.back.text)).toEqual(['Lissabon', 'Portugal', 'Portugal']);
  });
  it('validates HSK records, identifiers, explicit standard and NFC pinyin', () => {
    expect(hskWords).toHaveLength(11000);
    expect(new Set(hskWords.map((w) => w.id)).size).toBe(hskWords.length);
    for (const w of hskWords) {
      expect(w.hskStandard).toBe('HSK-3.0-2025-11');
      expect(['1', '2', '3', '4', '5', '6', '7-9']).toContain(w.hskLevel);
      expect(w.pinyin.normalize('NFC')).toBe(w.pinyin);
      expect(w.pinyin).not.toMatch(/[1-5]/);
    }
    expect(hskWords.find((w) => w.simplified === '电脑')?.pinyin).toBe('diànnǎo');
  });
  it('maps explicit self-report grades without treating normal reveal as a hint', () => {
    expect(selfRatings.map((r) => r.grade)).toEqual(['again', 'hard', 'good', 'easy']);
    for (const r of selfRatings) expect(gradeSelfRecall(r.grade, 0, false)).toBe(r.grade);
    expect(gradeSelfRecall('easy', 1, false)).toBe('hard');
    expect(gradeSelfRecall('good', 0, true)).toBe('again');
  });
  it('has exactly four generated skill items and exact formulas', () => {
    expect(conversionDeck.getLearningUnits()).toHaveLength(4);
    expect(conversions[0]!.convert(68)).toBe(20);
    expect(conversions[1]!.convert(20)).toBe(68);
    expect(conversions[2]!.convert(1)).toBe(1.609344);
    expect(conversions[3]!.convert(1.609344)).toBe(1);
  });
  it('deterministically generates bounded, pedagogical conversions', () => {
    for (const u of conversionDeck.getLearningUnits()) {
      for (let i = 0; i < 100; i++) {
        const ctx = { random: () => i / 100, difficulty: 0 };
        const card = conversionDeck.generateCard(u, ctx);
        expect(card).toEqual(conversionDeck.generateCard(u, ctx));
        const n = card.metadata.input as number;
        expect(Number.isFinite(card.metadata.output)).toBe(true);
        expect(Math.abs(n)).toBeLessThanOrEqual(140);
        if (u.direction === 'F-to-C') expect(Number.isInteger(card.metadata.output)).toBe(true);
      }
    }
  });
  it('keeps disabled and filtered due cards out of new and resumed sessions without deleting FSRS', async () => {
    const state = createEmptySnapshot();
    const u = countryDeck.getLearningUnits()[0]!;
    state.scheduledUnits = [new FsrsScheduler().create(u.id, new Date('2020-01-01'))];
    state.settings.deckSettings.countries = {
      enabled: false,
      subsets: ['Europa'],
      directions: ['country_to_capital'],
    };
    const repository = new InMemoryLearningRepository(state);
    await repository.saveSettings(state.settings);
    const loaded = await repository.load();
    expect(loaded.scheduledUnits).toHaveLength(1);
    expect(flashcardEnabled(u.id, loaded.settings)).toBe(false);
    const input = {
      catalog: [u],
      scheduled: loaded.scheduledUnits,
      mastery: [],
      recentSessions: [],
      focusWeights: {},
      eligible: sessionEligibility(loaded),
    };
    expect(selectDailySession(input)).toEqual([]);
    expect(resolveLearningUnits(input, [u.id])).toEqual([]);
    loaded.settings.deckSettings.countries!.enabled = true;
    expect(flashcardEnabled(u.id, loaded.settings)).toBe(true);
    expect(flashcardEnabled(countryDeck.getLearningUnits()[1]!.id, loaded.settings)).toBe(false);
    loaded.settings.deckSettings.countries!.subsets = ['Asien'];
    expect(flashcardEnabled(u.id, loaded.settings)).toBe(false);
  });
  it('migrates version one backups without losing history or settings', () => {
    const state = createEmptySnapshot();
    state.schemaVersion = 1;
    const legacy = JSON.parse(JSON.stringify(state));
    delete legacy.settings.deckSettings;
    legacy.settings.focusWeights = { pi: 3 };
    const migrated = parseSnapshot(legacy);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.settings.deckSettings).toEqual({});
    expect(migrated.settings.focusWeights.pi).toBe(3);
    expect(migrated.settings.focusWeights.flashcards).toBe(1);
    expect(migrated.attempts).toEqual(state.attempts);
  });
});
it('includes a due flashcard alongside existing disciplines in a mixed session', () => {
  const state = createEmptySnapshot();
  const u = countryDeck.getLearningUnits()[0]!;
  state.scheduledUnits = [new FsrsScheduler().create(u.id, new Date('2020-01-01'))];
  const old = {
    id: 'pi:chunk:1',
    discipline: 'pi' as const,
    title: 'Pi',
    stage: 'teaching' as const,
    estimatedSeconds: 45,
  };
  const plan = selectDailySession({
    catalog: [old, u],
    scheduled: state.scheduledUnits,
    mastery: [],
    recentSessions: [],
    focusWeights: state.settings.focusWeights,
    eligible: sessionEligibility(state),
  });
  expect(plan.map((u) => u.discipline)).toEqual(['flashcards', 'pi']);
});
it('preserves non-empty version-one attempts, FSRS, mastery and sessions', () => {
  const state = createEmptySnapshot();
  state.schemaVersion = 1;
  state.scheduledUnits = [new FsrsScheduler().create('pi:chunk:1')];
  state.mastery = [
    {
      learningUnitId: 'pi:chunk:1',
      discipline: 'pi',
      stage: 'assisted',
      strength: 0.42,
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];
  state.attempts = [
    {
      id: 'legacy',
      learningUnitId: 'pi:chunk:1',
      discipline: 'pi',
      exerciseId: 'legacy-e',
      generatedParameters: { digits: '14159' },
      correct: true,
      responseTimeMs: 3210,
      hintsUsed: 1,
      answerRevealed: false,
      attemptedAt: '2026-01-01T00:00:00Z',
      grade: 'hard',
    },
  ];
  state.sessions = [
    {
      id: 'daily:2026-01-01',
      startedAt: '2026-01-01T00:00:00Z',
      plannedUnitIds: ['pi:chunk:1'],
      completedAttemptIds: ['legacy'],
    },
  ];
  const migrated = parseSnapshot(JSON.parse(JSON.stringify(state)));
  for (const key of ['attempts', 'scheduledUnits', 'mastery', 'sessions'] as const)
    expect(migrated[key]).toEqual(state[key]);
});

it('supports six field directions with Danish and honest English fallback', () => {
  const units = hskDeck.getLearningUnits().filter((u) => u.recordId === 'HSK-3.0-2025-11-1');
  const cards = new Map(
    units.map((u) => [u.direction, hskDeck.generateCard(u, { random: () => 0, difficulty: 0 })])
  );
  expect(cards.get('pinyin_to_meaning')?.front.text).toBe('ài');
  expect(cards.get('pinyin_to_meaning')?.back.text).toContain('elske');
  expect(cards.get('meaning_to_pinyin')?.back.text).toBe('ài');
  expect(cards.get('pinyin_to_hanzi')?.back.text).toBe('爱');
  const english = hskWords.find((w) => !w.meaningsDa.length && w.meaningsEn.length)!;
  const u = hskDeck
    .getLearningUnits()
    .find((u) => u.recordId === english.id && u.direction === 'hanzi_to_meaning')!;
  expect(hskDeck.generateCard(u, { random: () => 0, difficulty: 0 }).back.secondary).toContain(
    'Engelsk'
  );
});
it('excludes unresolved meanings from meaning directions and starts with only level one', () => {
  const units = hskDeck.getLearningUnits();
  const unresolved = new Set(
    hskWords.filter((w) => !w.meaningsDa.length && !w.meaningsEn.length).map((w) => w.id)
  );
  expect(unresolved.size).toBe(8);
  expect(
    units.filter((u) => unresolved.has(u.recordId)).every((u) => !u.direction.includes('meaning'))
  ).toBe(true);
  expect(hskDeck.getLearningUnits()).toBe(units);
  const selection = deckSelection(hskDeck, createEmptySnapshot().settings);
  expect(selection.subsets).toEqual(['HSK-3.0-2025-11/1']);
  expect(selection.directions).toEqual(['hanzi_to_meaning']);
  expect(hskDeck.getSubsets()).toHaveLength(7);
});

it('provides 197 countries in six regions with independent direction IDs and local flags', () => {
  expect(countryDeck.getLearningUnits()).toHaveLength(197 * 3);
  expect(countryDeck.getSubsets()).toEqual([
    'Europa',
    'Asien',
    'Afrika',
    'Nordamerika',
    'Sydamerika',
    'Oceanien',
  ]);
  const units = countryDeck.getLearningUnits();
  const flag = units.find((u) => u.recordId === 'PT' && u.direction === 'flag_to_country')!;
  expect(flag.id).toBe('flashcards:countries:PT:flag_to_country');
  const card = countryDeck.generateCard(flag, { random: () => 0, difficulty: 0 });
  expect(card.front.image).toBe('/assets/flags/pt.svg');
  expect(card.back.text).toBe('Portugal');
  const southAfrica = units.find(
    (u) => u.recordId === 'ZA' && u.direction === 'country_to_capital'
  )!;
  const answer = countryDeck.generateCard(southAfrica, { random: () => 0, difficulty: 0 }).back;
  expect(answer.text).toContain('Pretoria');
  expect(answer.text).toContain('Cape Town');
  expect(answer.text).toContain('Bloemfontein');
  expect(answer.secondary).toContain('administrativ');
});
it('keeps an existing Europe/Asia selection unchanged when adding continents', () => {
  const state = createEmptySnapshot();
  state.settings.deckSettings.countries = {
    enabled: true,
    subsets: ['Europa', 'Asien'],
    directions: ['country_to_capital'],
  };
  expect(flashcardEnabled('flashcards:countries:DK:country_to_capital', state.settings)).toBe(true);
  expect(flashcardEnabled('flashcards:countries:KE:country_to_capital', state.settings)).toBe(
    false
  );
  state.settings.deckSettings.countries.subsets.push('Afrika');
  expect(flashcardEnabled('flashcards:countries:KE:country_to_capital', state.settings)).toBe(true);
});
