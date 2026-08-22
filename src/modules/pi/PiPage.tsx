import { useMemo, useState } from 'react';
import { ExerciseShell } from '../../components/ExerciseShell';
import { createHintProgress, revealNextHint } from '../../learning/hints/hintProgress';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import {
  createContinueExercise,
  createFillGapExercise,
  isPiAnswer,
  piDiagnosticPrompts,
  type PiExerciseKind,
} from './exercises';
import { PI_100 } from './piData';

export function PiPage() {
  const [kind, setKind] = useState<PiExerciseKind>('continue');
  const [start, setStart] = useState(16);
  const exercise = useMemo(
    () => (kind === 'continue' ? createContinueExercise(start) : createFillGapExercise(start)),
    [kind, start]
  );
  const [hints, setHints] = useState(() => createHintProgress(exercise.hints));
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { record, restartTimer } = useAttemptRecorder(exercise);

  const switchExercise = (nextKind: PiExerciseKind) => {
    setKind(nextKind);
    setStart(nextKind === 'continue' ? 16 : 24);
    setValue('');
    setFeedback(null);
    const next = nextKind === 'continue' ? createContinueExercise(16) : createFillGapExercise(24);
    setHints(createHintProgress(next.hints));
    restartTimer();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const correct = isPiAnswer(value, exercise.parameters.answer);
    setFeedback(
      correct ? 'Ja — den overgang holder.' : `Det rigtige vindue er ${exercise.parameters.answer}.`
    );
    await record({
      correct,
      hintsUsed: hints.used,
      answerRevealed: hints.answerRevealed,
      stage: 'assisted',
      fluentThresholdMs: 10_000,
    });
  };
  const next = () => {
    const nextStart = Math.min(90, start + 7);
    setStart(nextStart);
    setValue('');
    setFeedback(null);
    const nextExercise =
      kind === 'continue' ? createContinueExercise(nextStart) : createFillGapExercise(nextStart);
    setHints(createHintProgress(nextExercise.hints));
    restartTimer();
  };

  return (
    <div className="page subject-page pi-page">
      <header className="subject-hero violet">
        <div>
          <p className="eyebrow">100 decimaler</p>
          <h1>Pi</h1>
          <p>Ikke kun forfra. Du lærer også at lande sikkert midt i strømmen.</p>
        </div>
        <div className="pi-mark">π</div>
      </header>
      <section className="digit-ribbon" aria-label="De første 100 decimaler af pi">
        {PI_100.split('').map((digit, index) => (
          <span
            className={index < 30 ? 'known' : index < 40 ? 'focus' : ''}
            key={index}
            title={`Position ${index + 1}`}
          >
            {digit}
            {(index + 1) % 10 === 0 && <small>{index + 1}</small>}
          </span>
        ))}
      </section>
      <div className="segmented" aria-label="Øvelsestype">
        <button
          className={kind === 'continue' ? 'active' : ''}
          onClick={() => switchExercise('continue')}
        >
          Fortsæt et sted fra
        </button>
        <button
          className={kind === 'fill-gap' ? 'active' : ''}
          onClick={() => switchExercise('fill-gap')}
        >
          Udfyld et hul
        </button>
      </div>
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
            Skriv fem cifre
            <input
              inputMode="numeric"
              autoComplete="off"
              value={value}
              maxLength={8}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
          <button className="button primary" disabled={Boolean(feedback)}>
            Tjek
          </button>
        </form>
        {feedback && (
          <div className="feedback" role="status">
            {feedback}
            <button type="button" className="button primary" onClick={next}>
              Nyt vindue
            </button>
          </div>
        )}
      </ExerciseShell>
      <section className="diagnostic-card">
        <div>
          <p className="eyebrow">Kort startdiagnose</p>
          <h2>Det du allerede kan, skal først bevises let</h2>
          <p>
            {piDiagnosticPrompts.length} små vinkler tester fortsættelse, indeks og broer. Intet
            markeres mestret på forhånd.
          </p>
        </div>
        <span className="status-pill">Klar · ikke gennemført</span>
      </section>
    </div>
  );
}
