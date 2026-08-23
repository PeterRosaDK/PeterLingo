import { useMemo, useRef, useState } from 'react';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import { createPrefixRunExercise } from './exercises';
import { evaluatePiPrefix, PI_CONTENT_LIMIT, type PiPrefixProgress } from './piData';

export function PiPrefixRun({ limit = PI_CONTENT_LIMIT }: { limit?: number }) {
  const exercise = useMemo(() => createPrefixRunExercise(limit), [limit]);
  const [value, setValue] = useState('');
  const [progress, setProgress] = useState<PiPrefixProgress>(() => evaluatePiPrefix('', limit));
  const [saved, setSaved] = useState(false);
  const terminal = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const { record, restartTimer } = useAttemptRecorder(exercise);

  const update = (rawValue: string) => {
    if (terminal.current) return;
    const next = evaluatePiPrefix(rawValue, limit);
    setValue(next.normalized);
    setProgress(next);
    if (next.wrong || next.complete) {
      terminal.current = true;
      void record({
        correct: next.complete,
        hintsUsed: 0,
        answerRevealed: false,
        stage: 'unassisted',
        fluentThresholdMs: 75_000,
        parameterOverrides: { correctDigits: next.correctDigits, limit },
      });
    }
  };

  const finish = () => {
    if (terminal.current || progress.correctDigits === 0) return;
    terminal.current = true;
    setSaved(true);
    void record({
      correct: true,
      hintsUsed: 0,
      answerRevealed: false,
      stage: 'unassisted',
      fluentThresholdMs: 75_000,
      parameterOverrides: {
        correctDigits: progress.correctDigits,
        limit,
        stoppedVoluntarily: true,
      },
    });
  };

  const restart = () => {
    terminal.current = false;
    setValue('');
    setProgress(evaluatePiPrefix('', limit));
    setSaved(false);
    restartTimer();
    requestAnimationFrame(() => input.current?.focus());
  };

  return (
    <section className="exercise-shell prefix-run" aria-labelledby="prefix-run-title">
      <header>
        <p className="eyebrow">Uden hjælp · fra position 1</p>
        <h2 id="prefix-run-title">Hvor langt kan du fortsætte fra 3 komma?</h2>
        <p>
          Skriv decimalerne i én strøm. Stop selv efter de cifre, du er sikker på, eller fortsæt til
          det første forkerte.
        </p>
      </header>
      <div className="prefix-score" aria-live="polite">
        <strong>{progress.correctDigits}</strong>
        <span>korrekte decimaler i træk</span>
      </div>
      <label className="prefix-input">
        <span className="sr-only">Decimaler af pi fra begyndelsen</span>
        <b aria-hidden="true">3,</b>
        <input
          ref={input}
          autoFocus
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          maxLength={limit}
          value={value}
          disabled={Boolean(progress.wrong) || progress.complete || saved}
          aria-invalid={Boolean(progress.wrong)}
          onChange={(event) => update(event.target.value)}
        />
      </label>
      {!progress.wrong && !progress.complete && !saved && (
        <button
          className="button secondary prefix-finish"
          type="button"
          disabled={progress.correctDigits === 0}
          onClick={finish}
        >
          Stop her og gem {progress.correctDigits || ''}
        </button>
      )}
      {progress.wrong && (
        <div className="feedback prefix-result" role="status">
          <span>
            Stop ved decimal {progress.wrong.position}. De første {progress.correctDigits} sad
            rigtigt; næste ciffer vises ikke i denne prøve.
          </span>
          <button className="button primary" type="button" onClick={restart}>
            Prøv igen fra start
          </button>
        </div>
      )}
      {progress.complete && (
        <div className="feedback prefix-result" role="status">
          <span>Alle {limit} tilgængelige decimaler sad rigtigt.</span>
          <button className="button primary" type="button" onClick={restart}>
            Kør igen
          </button>
        </div>
      )}
      {saved && (
        <div className="feedback prefix-result" role="status">
          <span>
            {progress.correctDigits} sikre decimaler er registreret uden at fremtvinge en fejl.
          </span>
          <button className="button primary" type="button" onClick={restart}>
            Prøv igen
          </button>
        </div>
      )}
    </section>
  );
}
