import { useMemo, useRef, useState } from 'react';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import { createPrefixRunExercise } from './exercises';
import { evaluatePiPrefix, type PiPrefixProgress } from './piData';

export function PiPrefixRun() {
  const exercise = useMemo(() => createPrefixRunExercise(), []);
  const [value, setValue] = useState('');
  const [progress, setProgress] = useState<PiPrefixProgress>(() => evaluatePiPrefix(''));
  const terminal = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const { record, restartTimer } = useAttemptRecorder(exercise);

  const update = (rawValue: string) => {
    if (terminal.current) return;
    const next = evaluatePiPrefix(rawValue);
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
      });
    }
  };

  const restart = () => {
    terminal.current = false;
    setValue('');
    setProgress(evaluatePiPrefix(''));
    restartTimer();
    requestAnimationFrame(() => input.current?.focus());
  };

  return (
    <section className="exercise-shell prefix-run" aria-labelledby="prefix-run-title">
      <header>
        <p className="eyebrow">Uden hjælp · fra position 1</p>
        <h2 id="prefix-run-title">Hvor langt kan du fortsætte fra 3 komma?</h2>
        <p>Skriv decimalerne i én strøm. Testen stopper ved det første forkerte ciffer.</p>
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
          maxLength={100}
          value={value}
          disabled={Boolean(progress.wrong) || progress.complete}
          aria-invalid={Boolean(progress.wrong)}
          onChange={(event) => update(event.target.value)}
        />
      </label>
      {progress.wrong && (
        <div className="feedback prefix-result" role="status">
          <span>
            Stop ved decimal {progress.wrong.position}. Du skrev {progress.wrong.typed}; det
            korrekte ciffer var {progress.wrong.expected}.
          </span>
          <button className="button primary" type="button" onClick={restart}>
            Prøv igen fra start
          </button>
        </div>
      )}
      {progress.complete && (
        <div className="feedback prefix-result" role="status">
          <span>Alle 100 decimaler sad rigtigt.</span>
          <button className="button primary" type="button" onClick={restart}>
            Kør igen
          </button>
        </div>
      )}
    </section>
  );
}
