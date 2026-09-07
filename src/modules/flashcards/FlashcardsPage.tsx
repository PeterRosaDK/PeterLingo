import provenance from './decks/hsk-provenance.json';
import { createHintProgress, revealNextHint } from '../../learning/hints/hintProgress';
import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLearningData } from '../../app/DataProvider';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import { selfRatings } from '../../learning/fsrs/selfRating';
import type { SchedulerGrade } from '../../learning/types';
import { attemptsOnDay } from '../../learning/gamification/dailyStars';
import { recommendedUnit } from '../shared/Practice';
import {
  decks,
  deckSelection,
  flashcardEnabled,
  flashcardUnits,
  type DeckUnit,
  type FlashcardDeck,
  type CardContent,
} from './engine';
function Content({ content }: { content: CardContent }) {
  return (
    <>
      <strong className={`card-content ${content.kind ?? 'text'}`}>{content.text}</strong>
      {content.image && <img src={content.image} alt="" />}
      {content.secondary && <span className="card-secondary">{content.secondary}</span>}
    </>
  );
}
function FlipCard({
  unit,
  deck,
  next,
  select,
}: {
  unit: DeckUnit;
  deck: FlashcardDeck;
  next: () => void;
  select: () => void;
}) {
  const { snapshot } = useLearningData();
  const [card] = useState(() =>
    deck.generateCard(unit, {
      random: Math.random,
      difficulty: snapshot.mastery.find((m) => m.learningUnitId === unit.id)?.strength ?? 0,
    })
  );
  const [exercise] = useState(() => ({
    id: crypto.randomUUID(),
    learningUnitId: unit.id,
    discipline: unit.discipline,
    prompt: card.front.text,
    parameters: { ...card.metadata, direction: card.direction, front: card.front, back: card.back },
    hints: card.hints ?? [],
  }));
  const [hintProgress, setHintProgress] = useState(() => createHintProgress(exercise.hints));
  const [flipped, setFlipped] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const { record } = useAttemptRecorder(exercise);
  async function rate(grade: SchedulerGrade) {
    if (lock.current || saved || !flipped) return;
    lock.current = true;
    select();
    setBusy(true);
    try {
      await record({
        correct: grade === 'good' || grade === 'easy',
        hintsUsed: hintProgress.used,
        answerRevealed: hintProgress.answerRevealed,
        stage: snapshot.mastery.find((m) => m.learningUnitId === unit.id)?.stage ?? 'teaching',
        fluentThresholdMs: 0,
        selfRating: grade,
        parameterOverrides: { normalCardReveal: true },
      });
      setSaved(true);
    } catch {
      setError('Kunne ikke gemme. Prøv igen.');
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <section className="exercise-shell flashcard-exercise">
      <p className="eyebrow">
        {deck.title} · {deck.directions.find((d) => d.id === unit.direction)?.label}
      </p>
      <p>Genkald svaret mentalt. Vend derefter kortet med tap, Enter eller mellemrum.</p>
      <button
        type="button"
        aria-label={flipped ? 'Kortets bagside' : 'Vend kortet'}
        className={`flip-card ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped(true)}
      >
        <Content content={flipped ? card.back : card.front} />
        <small>{flipped ? 'Sådan lyder facit' : 'Tap for at vende'}</small>
      </button>
      {!flipped && hintProgress.hasMore && (
        <button
          className="button subtle"
          onClick={() => setHintProgress((p) => revealNextHint(exercise.hints, p))}
        >
          Giv mig et hint
        </button>
      )}
      {hintProgress.visible.length > 0 && (
        <ol className="hint-list">
          {hintProgress.visible.map((h) => (
            <li key={h.id}>
              <strong>{h.label}</strong>
              <span>{h.content}</span>
            </li>
          ))}
        </ol>
      )}
      {flipped && !saved && (
        <div className="self-ratings">
          {selfRatings.map((r) => (
            <button
              key={r.grade}
              className="button secondary"
              disabled={busy}
              onClick={() => void rate(r.grade)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
      {saved && (
        <div role="status" className="feedback">
          <p>Gemt. Næste repetition følger din FSRS-vurdering.</p>
          <button className="button primary" onClick={next}>
            Næste kort
          </button>
          <Link className="button secondary" to="/session">
            Til dagens træning
          </Link>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
function ReadyFlashcardsPage() {
  const { snapshot, repository, refresh, ready } = useLearningData();
  const [params] = useSearchParams();
  const [selectedDeck, setSelectedDeck] = useState(
    () => flashcardUnits.find((u) => u.id === params.get('unit'))?.deckId ?? 'hsk'
  );
  const [selectedUnit, setSelectedUnit] = useState<string | null>(
    () =>
      params.get('unit') ??
      recommendedUnit(
        flashcardUnits.filter((u) => u.deckId === 'hsk'),
        snapshot
      )?.id ??
      null
  );
  const [counter, setCounter] = useState(0);
  const [error, setError] = useState('');
  const [localDeckSettings, setLocalDeckSettings] = useState(snapshot.settings.deckSettings);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const appSettings = { ...snapshot.settings, deckSettings: localDeckSettings };
  const deck = decks.find((d) => d.id === selectedDeck)!;
  const selection = deckSelection(deck, appSettings);
  const units = deck
    .getLearningUnits()
    .filter(
      (u) => selection.subsets.includes(u.subset) && selection.directions.includes(u.direction)
    );
  const active =
    units.find((u) => u.id === selectedUnit) ??
    (recommendedUnit(units, snapshot) as DeckUnit | undefined);
  async function update(id: string, patch: Partial<ReturnType<typeof deckSelection>>) {
    const d = decks.find((d) => d.id === id)!;
    const next = { ...localDeckSettings, [id]: { ...deckSelection(d, appSettings), ...patch } };
    setLocalDeckSettings(next);
    setSettingsBusy(true);
    try {
      await repository.saveSettings({ ...snapshot.settings, deckSettings: next });
      await refresh();
    } catch {
      setLocalDeckSettings(snapshot.settings.deckSettings);
      setError('Indstillinger kunne ikke gemmes.');
    } finally {
      setSettingsBusy(false);
    }
  }
  if (!ready) return <div className="page">Åbner Flashkort …</div>;
  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Genkald · vend · vurder</p>
        <h1>Flashkort</h1>
        <p>Tre decks, samme læringsmotor. Dine retninger har hver sin hukommelse.</p>
      </header>
      <div className="deck-grid">
        {decks.map((d) => {
          const ids = new Set(d.getLearningUnits().map((u) => u.id));
          const settings = deckSelection(d, appSettings);
          const mastery = snapshot.mastery.filter((m) => ids.has(m.learningUnitId));
          const due = snapshot.scheduledUnits.filter(
            (c) =>
              ids.has(c.learningUnitId) &&
              flashcardEnabled(c.learningUnitId, snapshot.settings) &&
              Date.parse(c.due) <= Date.now()
          ).length;
          return (
            <article
              className={`lesson-card ${d.id === selectedDeck ? 'selected-deck' : ''}`}
              key={d.id}
            >
              <button
                className="deck-title"
                onClick={() => {
                  setSelectedDeck(d.id);
                  setSelectedUnit(
                    recommendedUnit(
                      d.getLearningUnits().filter((u) => {
                        const s = deckSelection(d, appSettings);
                        return s.subsets.includes(u.subset) && s.directions.includes(u.direction);
                      }),
                      snapshot
                    )?.id ?? null
                  );
                }}
              >
                <h2>{d.title}</h2>
              </button>
              <p>{d.description}</p>
              <p>
                {settings.subsets.length} aktive udvalg · {due} klar nu
              </p>
              <p>
                {mastery.length
                  ? Math.round((mastery.reduce((s, m) => s + m.strength, 0) / mastery.length) * 100)
                  : 0}
                % styrke ·{' '}
                {attemptsOnDay(snapshot.attempts).filter((a) => ids.has(a.learningUnitId)).length}{' '}
                øvet i dag
              </p>
              <label>
                <input
                  type="checkbox"
                  disabled={settingsBusy}
                  checked={settings.enabled}
                  onChange={(e) => void update(d.id, { enabled: e.target.checked })}
                />{' '}
                Med i dagens træning
              </label>
            </article>
          );
        })}
      </div>
      <section className="lesson-card">
        <h2>{deck.title} · dit udvalg</h2>
        <fieldset>
          <legend>{deck.id === 'hsk' ? 'HSK-niveauer' : 'Subsets'}</legend>
          {deck.getSubsets().map((s) => (
            <label key={s}>
              <input
                type="checkbox"
                disabled={settingsBusy}
                checked={selection.subsets.includes(s)}
                onChange={(e) =>
                  void update(deck.id, {
                    subsets: e.target.checked
                      ? [...selection.subsets, s]
                      : selection.subsets.filter((v) => v !== s),
                  })
                }
              />
              {deck.id === 'hsk'
                ? `HSK ${s.split('/').at(-1)} · ${provenance.levels[s.split('/').at(-1) as keyof typeof provenance.levels]} ord`
                : s}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Recall-retninger</legend>
          {deck.directions.map((d) => (
            <label key={d.id}>
              <input
                type="checkbox"
                disabled={settingsBusy}
                checked={selection.directions.includes(d.id)}
                onChange={(e) =>
                  void update(deck.id, {
                    directions: e.target.checked
                      ? [...selection.directions, d.id]
                      : selection.directions.filter((v) => v !== d.id),
                  })
                }
              />
              {d.label}
            </label>
          ))}
        </fieldset>
        {deck.id === 'hsk' && (
          <p>
            Hele ordlisten: 11.000 records fra HSK 3.0, pensum udgivet november 2025. Vælg frit
            mellem tegn (Hanzi), udtale (pinyin) og betydning som forside og facit.{' '}
            {provenance.danishRecords} ord har et redaktionelt dansk facit; resten bruger CC-CEDICT
            på engelsk. Niveau 7–9 er én samlet officiel gruppe.{' '}
            {provenance.unresolvedMeanings.length} ord afventer afklaring af betydning og trænes kun
            mellem tegn og pinyin. Data:{' '}
            <a href="https://github.com/krmanik/HSK-3.0">Mani / HSK-3.0</a> og{' '}
            <a href="https://www.mdbg.net/chinese/dictionary?page=cedict">CC-CEDICT</a>, tilpasset
            med danske betydninger af PeterLingo,{' '}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.
          </p>
        )}
      </section>
      {settingsBusy && <p aria-live="polite">Gemmer dit udvalg …</p>}
      {active ? (
        <FlipCard
          key={`${active.id}:${counter}`}
          unit={active as DeckUnit}
          deck={deck}
          select={() => setSelectedUnit(active.id)}
          next={() => {
            setSelectedUnit(recommendedUnit(units, snapshot)?.id ?? null);
            setCounter((n) => n + 1);
          }}
        />
      ) : (
        <p>Vælg mindst ét subset og én retning.</p>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export function FlashcardsPage() {
  const { ready } = useLearningData();
  return ready ? <ReadyFlashcardsPage /> : <div className="page">Åbner Flashkort …</div>;
}
