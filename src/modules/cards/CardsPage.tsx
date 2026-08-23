import { useMemo, useState } from 'react';
import { ExerciseShell } from '../../components/ExerciseShell';
import { createHintProgress, revealNextHint } from '../../learning/hints/hintProgress';
import type { GeneratedExercise } from '../../learning/types';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import {
  BCS_STACK,
  NEXT_SUIT,
  PREVIOUS_SUIT,
  RANK_LABELS,
  SAME_COLOUR_OPPOSITE,
  SUIT_LABELS,
  SUIT_VALUES,
  accessibleCardName,
  nextBcsCard,
  parseCard,
  type CardCode,
} from './bcs';
import { PlayingCard } from './PlayingCard';
import { BcsIntro } from './BcsIntro';
import { BcsStackOverview } from './BcsStackOverview';

function makeExercise(card: CardCode): GeneratedExercise<{ current: CardCode; answer: CardCode }> {
  const value = parseCard(card);
  const answer = nextBcsCard(card);
  const next = parseCard(answer);
  const doubled = value.rank * 2 + SUIT_VALUES[value.suit];
  const reduced = ((doubled - 1) % 13) + 1;
  const relation =
    next.rank <= 3
      ? 'samme kulør'
      : next.rank <= 6
        ? `samme farve: ${SUIT_LABELS[SAME_COLOUR_OPPOSITE[value.suit]]}`
        : next.rank <= 9
          ? `forrige kulør: ${SUIT_LABELS[PREVIOUS_SUIT[value.suit]]}`
          : `næste kulør: ${SUIT_LABELS[NEXT_SUIT[value.suit]]}`;
  return {
    id: `bcs:${card}`,
    learningUnitId: 'cards:bcs-next',
    discipline: 'cards',
    prompt: `Hvilket kort følger efter ${accessibleCardName(card)}?`,
    parameters: { current: card, answer },
    hints: [
      {
        id: 'suit-value',
        label: 'Kulørværdi',
        content: `${SUIT_LABELS[value.suit]} har kulørværdien ${SUIT_VALUES[value.suit]}. Det er kun et fast hjælpetal i BCS-reglen.`,
      },
      {
        id: 'rank',
        label: 'Regn den nye kortværdi ud',
        content: `${value.rank} × 2 + ${SUIT_VALUES[value.suit]} = ${doubled}. ${doubled > 13 ? `Træk 13 fra, indtil tallet er mellem 1 og 13: ${reduced}` : `Tallet er allerede mellem 1 og 13: ${reduced}`}. Det svarer til ${RANK_LABELS[next.rank].toLowerCase()}.`,
      },
      {
        id: 'relation',
        label: 'Vælg den nye kulør',
        content: `Den nye kortværdi er ${next.rank}, så reglen siger ${relation}.`,
      },
      {
        id: 'answer',
        label: 'Vis kortet',
        content: `Det er ${accessibleCardName(answer)}.`,
        revealsAnswer: true,
      },
    ],
  };
}

function choicesFor(card: CardCode): CardCode[] {
  const answer = nextBcsCard(card);
  const index = BCS_STACK.indexOf(answer);
  return [
    answer,
    BCS_STACK[(index + 7) % 52]!,
    BCS_STACK[(index + 19) % 52]!,
    BCS_STACK[(index + 31) % 52]!,
  ].sort((a, b) => a.localeCompare(b));
}

export function CardsPage() {
  const [index, setIndex] = useState(0);
  const exercise = useMemo(() => makeExercise(BCS_STACK[index]!), [index]);
  const options = choicesFor(exercise.parameters.current);
  const [hints, setHints] = useState(() => createHintProgress(exercise.hints));
  const [feedback, setFeedback] = useState<string | null>(null);
  const { record, restartTimer } = useAttemptRecorder(exercise);
  const answer = async (card: CardCode) => {
    if (feedback) return;
    const correct = card === exercise.parameters.answer;
    setFeedback(
      correct
        ? 'Lige præcis. Både værdi og kulør passer.'
        : `Næste kort er ${accessibleCardName(exercise.parameters.answer)}.`
    );
    await record({
      correct,
      hintsUsed: hints.used,
      answerRevealed: hints.answerRevealed,
      stage: 'assisted',
      fluentThresholdMs: 8_000,
    });
  };
  const next = () => {
    const nextIndex = (index + 11) % 52;
    setIndex(nextIndex);
    const nextExercise = makeExercise(BCS_STACK[nextIndex]!);
    setHints(createHintProgress(nextExercise.hints));
    setFeedback(null);
    restartTimer();
  };

  return (
    <div className="page subject-page cards-page">
      <header className="subject-hero coral">
        <div>
          <p className="eyebrow">BCS bliver til MBCS</p>
          <h1>Kortene kommer tilbage</h1>
          <p>Først genfinder du reglen. Senere bliver kort og position ét øjeblikkeligt svar.</p>
        </div>
        <div className="card-fan">
          <PlayingCard card="1S" size="small" stacked dealt />
          <PlayingCard card="7D" size="small" stacked dealt />
          <PlayingCard card="13S" size="small" stacked dealt />
        </div>
      </header>
      <BcsIntro />
      <BcsStackOverview />
      <ExerciseShell
        eyebrow="BCS · næste kort"
        title={exercise.prompt}
        hints={exercise.hints}
        hintProgress={hints}
        onHint={() => setHints((current) => revealNextHint(exercise.hints, current))}
      >
        <div className="current-card">
          <PlayingCard card={exercise.parameters.current} size="large" dealt />
        </div>
        <div className="card-choices">
          {options.map((card) => (
            <button
              key={card}
              type="button"
              onClick={() => void answer(card)}
              disabled={Boolean(feedback)}
              aria-label={`Vælg ${accessibleCardName(card)}`}
            >
              <PlayingCard card={card} size="medium" />
            </button>
          ))}
        </div>
        {feedback && (
          <div className="feedback" role="status">
            {feedback}
            <button className="button primary" type="button" onClick={next}>
              Næste kort
            </button>
          </div>
        )}
      </ExerciseShell>
    </div>
  );
}
