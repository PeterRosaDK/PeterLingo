import type { HintProgress } from '../learning/hints/hintProgress';
import type { ProgressiveHint } from '../learning/types';

interface ExerciseShellProps {
  eyebrow: string;
  title: string;
  hints: ProgressiveHint[];
  hintProgress: HintProgress;
  onHint(): void;
  children: React.ReactNode;
}

export function ExerciseShell({
  eyebrow,
  title,
  hints,
  hintProgress,
  onHint,
  children,
}: ExerciseShellProps) {
  return (
    <section className="exercise-shell">
      <header>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </header>
      {children}
      {hintProgress.visible.length > 0 && (
        <ol className="hint-list" aria-live="polite">
          {hintProgress.visible.map((hint) => (
            <li key={hint.id}>
              <strong>{hint.label}</strong>
              <span>{hint.content}</span>
            </li>
          ))}
        </ol>
      )}
      {hintProgress.hasMore && (
        <button type="button" className="button subtle" onClick={onHint}>
          {hintProgress.used === 0
            ? 'Giv mig et hint'
            : `Næste hint · ${hints.length - hintProgress.used} tilbage`}
        </button>
      )}
    </section>
  );
}
