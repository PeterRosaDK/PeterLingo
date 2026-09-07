import { describe, it, expect } from 'vitest';
import {
  decks,
  flashcardUnits,
  hskWords,
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
    expect(ids).toHaveLength(3);
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
    expect(hskWords.length).toBeGreaterThanOrEqual(20);
    expect(new Set(hskWords.map((w) => w.id)).size).toBe(hskWords.length);
    for (const w of hskWords) {
      expect(w.hskStandard).toBe('HSK-3.0-2025-11');
      expect(w.hskLevel).toBe('1');
      expect(w.pinyin.normalize('NFC')).toBe(w.pinyin);
      expect(w.pinyin).not.toMatch(/[1-5]/);
      expect(w.meaningsEn.length).toBeGreaterThan(0);
      expect(w.meaningsDa).toEqual([]);
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
