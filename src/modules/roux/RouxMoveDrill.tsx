import { useMemo, useState } from 'react';
import type { GeneratedExercise } from '../../learning/types';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';

const moveChoices = ['R', "R'", 'U', "U'", 'L', "L'", 'M', "M'"];
const sequences = [
  ['R', 'U', "R'"],
  ['M', "U'", "M'"],
  ["L'", 'U', 'L'],
  ["R'", "U'", 'R'],
] as const;

function exerciseFor(seed: number): GeneratedExercise<{ answer: string; sequence: string[] }> {
  const sequence = [...sequences[Math.abs(seed) % sequences.length]!];
  return {
    id: `roux:move-sequence:${seed}`,
    learningUnitId: 'roux:move-sequence',
    discipline: 'roux',
    prompt: 'Gentag den korte træksekvens',
    parameters: { answer: sequence.join(' '), sequence },
    hints: [],
  };
}

export function RouxMoveDrill() {
  const [seed, setSeed] = useState(0);
  const exercise = useMemo(() => exerciseFor(seed), [seed]);
  const [entered, setEntered] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { record, restartTimer } = useAttemptRecorder(exercise);

  const choose = async (move: string) => {
    if (feedback) return;
    const next = [...entered, move];
    setEntered(next);
    if (next.length < exercise.parameters.sequence.length) return;
    const correct = next.join(' ') === exercise.parameters.answer;
    setFeedback(correct ? 'Sekvensen sad rigtigt.' : 'Ikke helt — nulstil hånden og prøv igen.');
    await record({
      correct,
      hintsUsed: 0,
      answerRevealed: false,
      stage: 'teaching',
      fluentThresholdMs: 8_000,
    });
  };

  const next = () => {
    setSeed((current) => current + 1);
    setEntered([]);
    setFeedback(null);
    restartTimer();
  };

  return (
    <section className="lesson-card roux-move-drill" aria-labelledby="roux-move-drill-title">
      <div>
        <p className="eyebrow">Dagens håndtræning · uden GoCube</p>
        <h2 id="roux-move-drill-title">Gentag tre træk</h2>
        <p>Læs fra venstre mod højre, og tryk derefter på de samme tre træk.</p>
      </div>
      <div className="roux-target-sequence" aria-label="Målsekvens">
        {exercise.parameters.sequence.map((move, index) => (
          <strong key={`${move}-${index}`}>{move}</strong>
        ))}
      </div>
      <div className="move-pad compact-move-pad" aria-label="Svar med notationstræk">
        {moveChoices.map((move) => (
          <button
            type="button"
            key={move}
            disabled={Boolean(feedback)}
            onClick={() => void choose(move)}
          >
            {move}
          </button>
        ))}
      </div>
      <p className="roux-entered" aria-live="polite">
        Dit svar: {entered.length ? entered.join(' ') : '—'}
      </p>
      {feedback && (
        <div className="feedback" role="status">
          <span>{feedback}</span>
          <button className="button primary" type="button" onClick={next}>
            Ny sekvens
          </button>
        </div>
      )}
    </section>
  );
}
