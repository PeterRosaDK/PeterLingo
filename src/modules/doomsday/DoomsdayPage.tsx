import { useMemo, useState } from 'react';
import { createHintProgress, revealNextHint } from '../../learning/hints/hintProgress';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import { ExerciseShell } from '../../components/ExerciseShell';
import { createDateExercise, generatedModernDate } from './exercises';
import { DANISH_MONTHS, DANISH_WEEKDAYS } from './doomsday';
import { DoomsdayIntro } from './DoomsdayIntro';

export function DoomsdayPage() {
  const [seed, setSeed] = useState(() => Date.now());
  const exercise = useMemo(() => createDateExercise(generatedModernDate(seed)), [seed]);
  const [hints, setHints] = useState(() => createHintProgress(exercise.hints));
  const [feedback, setFeedback] = useState<string | null>(null);
  const { record, restartTimer } = useAttemptRecorder(exercise);

  const answer = async (weekday: number) => {
    if (feedback) return;
    const correct = weekday === exercise.parameters.answer;
    setFeedback(
      correct
        ? 'Præcis — hele kæden lander dér.'
        : `Ikke helt. Det er ${DANISH_WEEKDAYS[exercise.parameters.answer]}.`
    );
    await record({
      correct,
      hintsUsed: hints.used,
      answerRevealed: hints.answerRevealed,
      stage: 'teaching',
      fluentThresholdMs: 18_000,
    });
  };

  const next = () => {
    const nextSeed = seed + 97_531;
    setSeed(nextSeed);
    const nextExercise = createDateExercise(generatedModernDate(nextSeed));
    setHints(createHintProgress(nextExercise.hints));
    setFeedback(null);
    restartTimer();
  };

  return (
    <div className="page subject-page doomsday-page">
      <header className="subject-hero citrine">
        <div>
          <p className="eyebrow">Mental kalender</p>
          <h1>Doomsday</h1>
          <p>Byg svaret trin for trin, indtil regnestykket sidder i fingrene.</p>
        </div>
        <div className="lesson-orbit">
          <span>1</span>
          <strong>Ugedagstal</strong>
          <i>→</i>
          <span>2</span>
          <strong>Ankerdag</strong>
          <i>→</i>
          <span>3</span>
          <strong>Dato</strong>
        </div>
      </header>

      <DoomsdayIntro />

      <ExerciseShell
        eyebrow="Genereret øvelse"
        title={exercise.prompt}
        hints={exercise.hints}
        hintProgress={hints}
        onHint={() => setHints((current) => revealNextHint(exercise.hints, current))}
      >
        <div className="calendar-object" aria-hidden="true">
          <span>{DANISH_MONTHS[exercise.parameters.month - 1]}</span>
          <strong>{exercise.parameters.day}</strong>
          <small>{exercise.parameters.year}</small>
        </div>
        <div className="answer-grid weekdays">
          {DANISH_WEEKDAYS.map((day, index) => (
            <button
              key={day}
              type="button"
              onClick={() => void answer(index)}
              disabled={Boolean(feedback)}
            >
              {day}
            </button>
          ))}
        </div>
        {feedback && (
          <div className="feedback" role="status">
            {feedback}
            <button className="button primary" type="button" onClick={next}>
              Ny dato
            </button>
          </div>
        )}
      </ExerciseShell>
    </div>
  );
}
