import { useEffect, useMemo, useRef, useState } from 'react';
import { useLearningData } from '../../app/DataProvider';
import { ExerciseShell } from '../../components/ExerciseShell';
import { createHintProgress, revealNextHint } from '../../learning/hints/hintProgress';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import {
  createBridgeExercise,
  createChunkExercise,
  createContinueExercise,
  evaluatePiAnswer,
  createFillGapExercise,
  createNeighbourExercise,
  createRandomAccessExercise,
  isPiAnswer,
  type PiExercise,
} from './exercises';
import { PiPrefixRun } from './PiPrefixRun';
import { PI_CONTENT_LIMIT } from './piData';
import { piLearningProfile, selectBridgeWindow, selectKnownWindow } from './progress';

type PiMode = 'diagnostic' | 'known' | 'learn' | 'bridge' | 'random' | 'neighbour';

const modes: { id: PiMode; title: string; description: string }[] = [
  {
    id: 'diagnostic',
    title: 'Find dit sikre punkt',
    description: 'Begynd ved 3 komma og stop, når du selv vil.',
  },
  {
    id: 'known',
    title: 'Styrk det kendte',
    description: 'Kun blokke inden for din nuværende arbejdsgrænse.',
  },
  {
    id: 'learn',
    title: 'Lær næste fem',
    description: 'Se, skjul og genkald præcis én ny blok.',
  },
  {
    id: 'bridge',
    title: 'Kryds en overgang',
    description: 'Fem cifre, der går hen over en blokgrænse.',
  },
  {
    id: 'random',
    title: 'Find et sted direkte',
    description: 'Positionsøvelser kun i sikkert territorium.',
  },
  {
    id: 'neighbour',
    title: 'Før og efter',
    description: 'Find de nærmeste cifre omkring en kendt passage.',
  },
];

function exerciseFor(mode: Exclude<PiMode, 'diagnostic'>, boundary: number, seed: number) {
  if (mode === 'learn')
    return boundary < PI_CONTENT_LIMIT
      ? createChunkExercise(boundary + 1)
      : createContinueExercise(selectKnownWindow(boundary, seed));
  if (mode === 'bridge') return createBridgeExercise(selectBridgeWindow(boundary, seed));
  if (mode === 'random') {
    const start = 1 + (Math.abs(seed) % Math.max(1, boundary - 4));
    return createRandomAccessExercise(start);
  }
  if (mode === 'neighbour') {
    const anchor = 3 + (Math.abs(seed) % Math.max(1, boundary - 6));
    return createNeighbourExercise(anchor, seed % 2 === 0 ? 'before' : 'after');
  }
  const start = selectKnownWindow(boundary, seed);
  return seed % 2 === 0 ? createContinueExercise(start) : createFillGapExercise(start);
}

function PiRecallExercise({
  exercise,
  studyFirst,
  onNext,
}: {
  exercise: PiExercise;
  studyFirst: boolean;
  onNext(): void;
}) {
  const [studying, setStudying] = useState(studyFirst);
  const [hints, setHints] = useState(() => createHintProgress(exercise.hints));
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const answerInput = useRef<HTMLInputElement>(null);
  const { record, restartTimer } = useAttemptRecorder(exercise);

  useEffect(() => {
    if (studying || feedback) return;
    const frame = requestAnimationFrame(() => {
      answerInput.current?.focus();
      answerInput.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [exercise.id, feedback, studying]);

  const nextAction = () => {
    if (studyFirst && !isPiAnswer(value, exercise.parameters.answer)) {
      setStudying(true);
      setHints(createHintProgress(exercise.hints));
      setValue('');
      setFeedback(null);
      restartTimer();
      return;
    }
    onNext();
  };

  if (studying)
    return (
      <section className="exercise-shell pi-study" aria-labelledby="pi-study-title">
        <header>
          <p className="eyebrow">
            Ny blok · position {exercise.parameters.start}–
            {exercise.parameters.start + exercise.parameters.count - 1}
          </p>
          <h2 id="pi-study-title">Se først — genkald bagefter</h2>
          <p>Den nye blok vises med vilje. Dette er undervisning, ikke en prøve.</p>
        </header>
        <div className="pi-study-sequence">
          <span>{exercise.parameters.context}</span>
          <strong>{exercise.parameters.answer}</strong>
        </div>
        <p className="pi-rhythm">
          Læs den som {exercise.parameters.answer.slice(0, 2)} ·{' '}
          {exercise.parameters.answer.slice(2)}. Kig væk, sig den én gang, og skjul den derefter.
          Sammen med de fem grå cifre bliver den dit nye ticifrede landmærke.
        </p>
        <button
          className="button primary"
          type="button"
          onClick={() => {
            setStudying(false);
            restartTimer();
          }}
        >
          Skjul og prøv selv
        </button>
      </section>
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (feedback) return;
    const evaluation = evaluatePiAnswer(value, exercise.parameters.answer);
    const correct = evaluation.complete;
    setFeedback(
      correct
        ? 'Ja — hele blokken sad rigtigt.'
        : evaluation.correctDigits > 0
          ? `${evaluation.correctDigits} af ${evaluation.totalDigits} cifre sad rigtigt. Det er reelt fremskridt; hele blokken er ${exercise.parameters.answer}.`
          : `Ikke endnu. Blokken er ${exercise.parameters.answer}. Se den roligt igen.`
    );
    await record({
      correct,
      hintsUsed: hints.used,
      answerRevealed: hints.answerRevealed,
      stage: studyFirst ? 'teaching' : 'assisted',
      fluentThresholdMs: exercise.parameters.count <= 2 ? 7_000 : 10_000,
      parameterOverrides: {
        correctDigits: evaluation.correctDigits,
        totalDigits: evaluation.totalDigits,
        digitAccuracy: evaluation.correctDigits / evaluation.totalDigits,
      },
    });
  };

  return (
    <ExerciseShell
      eyebrow={`Position ${exercise.parameters.start}–${exercise.parameters.start + exercise.parameters.count - 1}`}
      title={exercise.prompt}
      hints={exercise.hints}
      hintProgress={hints}
      onHint={() => setHints((current) => revealNextHint(exercise.hints, current))}
    >
      <div className="pi-context">
        <span>3.</span>
        {exercise.parameters.context || '…'}
      </div>
      <form className="inline-answer" onSubmit={(event) => void submit(event)}>
        <label>
          Skriv {exercise.parameters.count === 2 ? 'to' : 'fem'} cifre
          <input
            ref={answerInput}
            autoFocus
            inputMode="numeric"
            autoComplete="off"
            value={value}
            maxLength={exercise.parameters.count + 2}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <button className="button primary" disabled={Boolean(feedback)}>
          Tjek
        </button>
      </form>
      {feedback && (
        <div className="feedback" role="status">
          <span>{feedback}</span>
          <button type="button" className="button primary" onClick={nextAction}>
            {studyFirst && !isPiAnswer(value, exercise.parameters.answer)
              ? 'Se blokken igen'
              : 'Ny opgave'}
          </button>
        </div>
      )}
    </ExerciseShell>
  );
}

export function PiPractice() {
  const { snapshot, ready } = useLearningData();
  const profile = piLearningProfile(snapshot.attempts, snapshot.mastery);
  const [mode, setMode] = useState<PiMode>('diagnostic');
  const [seed, setSeed] = useState(() => Date.now());
  const [learnStart, setLearnStart] = useState(31);
  const exercise = useMemo(() => {
    if (mode === 'diagnostic') return null;
    if (mode === 'learn')
      return learnStart <= PI_CONTENT_LIMIT
        ? createChunkExercise(learnStart)
        : createContinueExercise(selectKnownWindow(profile.workingBoundary, seed));
    return exerciseFor(mode, profile.workingBoundary, seed);
  }, [learnStart, mode, profile.workingBoundary, seed]);

  if (!ready) return <section className="lesson-card">Finder din forsigtige startgrænse …</section>;

  return (
    <>
      <section className="lesson-card pi-frontier" aria-labelledby="pi-frontier-title">
        <div>
          <p className="eyebrow">Din næste, overskuelige grænse</p>
          <h2 id="pi-frontier-title">Sikkert arbejde til decimal {profile.workingBoundary}</h2>
          <p>
            {profile.verifiedPrefix
              ? `Din længste registrerede serie er ${profile.verifiedPrefix} korrekte decimaler.`
              : 'Vi begynder ved de første 30 decimaler, som du allerede kender, og kontrollerer dem uden at antage mere.'}{' '}
            Nye øvelser åbner kun fem cifre ad gangen.
          </p>
        </div>
        <div className="pi-frontier-score">
          <strong>{profile.workingBoundary}</strong>
          <span>næste milepæl: {profile.milestone}</span>
        </div>
        <div className="pi-frontier-track" aria-hidden="true">
          <i style={{ width: `${(profile.workingBoundary / profile.milestone) * 100}%` }} />
        </div>
      </section>

      <section className="pi-mode-grid" aria-label="Pi-træningstyper">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={mode === item.id ? 'active' : ''}
            aria-pressed={mode === item.id}
            onClick={() => {
              setMode(item.id);
              setSeed(Date.now());
              if (item.id === 'learn' && profile.nextChunkStart)
                setLearnStart(profile.nextChunkStart);
            }}
          >
            <strong>{item.title}</strong>
            <small>{item.description}</small>
            {item.id === 'learn' && profile.nextChunkStart && (
              <em>
                {profile.nextChunkStart}–{profile.nextChunkEnd}
              </em>
            )}
          </button>
        ))}
      </section>

      {mode === 'diagnostic' ? (
        <PiPrefixRun />
      ) : exercise ? (
        <PiRecallExercise
          key={exercise.id}
          exercise={exercise}
          studyFirst={mode === 'learn'}
          onNext={() => {
            setSeed((current) => current + 65_537);
            if (mode === 'learn' && profile.nextChunkStart) setLearnStart(profile.nextChunkStart);
          }}
        />
      ) : null}
    </>
  );
}
