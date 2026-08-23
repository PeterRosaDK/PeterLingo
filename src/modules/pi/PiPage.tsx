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
import { PiPrefixRun } from './PiPrefixRun';

export function PiPage() {
  const [kind, setKind] = useState<PiExerciseKind>('continue');
  const [start, setStart] = useState(16);
  const exercise = useMemo(
    () => (kind === 'fill-gap' ? createFillGapExercise(start) : createContinueExercise(start)),
    [kind, start]
  );
  const [hints, setHints] = useState(() => createHintProgress(exercise.hints));
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { record, restartTimer } = useAttemptRecorder(exercise);

  const switchExercise = (nextKind: PiExerciseKind) => {
    setKind(nextKind);
    setStart(nextKind === 'fill-gap' ? 24 : 16);
    setValue('');
    setFeedback(null);
    const next = nextKind === 'fill-gap' ? createFillGapExercise(24) : createContinueExercise(16);
    setHints(createHintProgress(next.hints));
    restartTimer();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const correct = isPiAnswer(value, exercise.parameters.answer);
    setFeedback(
      correct
        ? 'Ja — de fem cifre er rigtige.'
        : `De rigtige fem cifre er ${exercise.parameters.answer}.`
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
          <p>Ikke kun forfra. Du lærer også at begynde sikkert midt i talrækken.</p>
        </div>
        <div className="pi-mark">π</div>
      </header>
      <div className="segmented" aria-label="Øvelsestype">
        <button
          className={kind === 'continue' ? 'active' : ''}
          onClick={() => switchExercise('continue')}
        >
          Fortsæt midt i rækken
        </button>
        <button
          className={kind === 'fill-gap' ? 'active' : ''}
          onClick={() => switchExercise('fill-gap')}
        >
          Udfyld et hul
        </button>
        <button
          className={kind === 'prefix-run' ? 'active' : ''}
          onClick={() => switchExercise('prefix-run')}
        >
          Skriv fra starten
        </button>
      </div>
      {kind === 'prefix-run' ? (
        <PiPrefixRun />
      ) : (
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
                Ny ciffergruppe
              </button>
            </div>
          )}
        </ExerciseShell>
      )}
      <section className="diagnostic-card">
        <div>
          <p className="eyebrow">Kort indledende prøve</p>
          <h2>Find ud af, hvad der allerede sidder fast</h2>
          <p>
            {piDiagnosticPrompts.length} små opgaver undersøger, om du kan fortsætte, finde en
            bestemt placering og huske overgangene. Intet regnes som lært på forhånd.
          </p>
        </div>
        <span className="status-pill">Klar · ikke gennemført</span>
      </section>
      <details className="lesson-card pi-reference">
        <summary>Vis de 100 decimaler som opslag</summary>
        <p>Åbn kun denne oversigt, når du vil kontrollere eller øve en bestemt passage.</p>
        <div className="digit-ribbon" aria-label="De første 100 decimaler af pi">
          {PI_100.split('').map((digit, index) => (
            <span key={index} title={`Position ${index + 1}`}>
              {digit}
              {(index + 1) % 10 === 0 && <small>{index + 1}</small>}
            </span>
          ))}
        </div>
      </details>
    </div>
  );
}
