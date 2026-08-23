import { useMemo, useState } from 'react';
import { useLearningData } from '../../app/DataProvider';
import { getAudioEngine } from '../../audio/ToneAudioEngine';
import { ExerciseShell } from '../../components/ExerciseShell';
import { createHintProgress, revealNextHint } from '../../learning/hints/hintProgress';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import { EAR_CURRICULUM_VERSION, presentationLabel } from './curriculum';
import { buildDailyEarRound, earAnswerOptions, type EarExercise } from './exercises';

function IntervalQuestion({
  exercise,
  position,
  onComplete,
}: {
  exercise: EarExercise;
  position: number;
  onComplete(correct: boolean): void;
}) {
  const [hints, setHints] = useState(() => createHintProgress(exercise.hints));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const { record } = useAttemptRecorder(exercise);

  const play = () => {
    void getAudioEngine().playInterval(
      exercise.parameters.rootMidi,
      exercise.parameters.targetMidi,
      exercise.parameters.harmonic
    );
  };

  const answer = async (name: string) => {
    if (feedback) return;
    const correct = name === exercise.parameters.answer;
    setWasCorrect(correct);
    setFeedback(
      correct
        ? `Ja — ${exercise.parameters.answer.toLowerCase()} ${presentationLabel(exercise.parameters.presentation)}.`
        : `Godt lyttet. Det var ${exercise.parameters.answer.toLowerCase()} ${presentationLabel(exercise.parameters.presentation)}.`
    );
    await record({
      correct,
      hintsUsed: hints.used,
      answerRevealed: hints.answerRevealed,
      stage: 'unassisted',
      fluentThresholdMs: 9_000,
      parameterOverrides: {
        selectedAnswer: name,
        earCurriculumVersion: EAR_CURRICULUM_VERSION,
      },
    });
  };

  return (
    <ExerciseShell
      eyebrow={`Dagens høretest · ${position} af 3 · ${presentationLabel(exercise.parameters.presentation)}`}
      title={exercise.prompt}
      hints={exercise.hints}
      hintProgress={hints}
      onHint={() => setHints((current) => revealNextHint(exercise.hints, current))}
    >
      <div className="ear-test-prompt">
        <button className="listen-button" type="button" onClick={play}>
          <span>▶</span>
          Afspil interval
        </button>
        <p>Du må afspille så mange gange, du har brug for. Det koster ikke noget.</p>
      </div>
      <div className="answer-grid intervals">
        {earAnswerOptions.map((name) => (
          <button
            key={name}
            type="button"
            disabled={Boolean(feedback)}
            onClick={() => void answer(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {feedback && (
        <div className="feedback" role="status">
          <div>
            <strong>{feedback}</strong>
            <button className="ear-replay-answer" type="button" onClick={play}>
              Hør intervallet igen
            </button>
          </div>
          <button className="button primary" type="button" onClick={() => onComplete(wasCorrect)}>
            {position === 3 ? 'Se dagens resultat' : 'Næste interval'}
          </button>
        </div>
      )}
    </ExerciseShell>
  );
}

export function DailyEarTest() {
  const { snapshot } = useLearningData();
  const [roundSeed, setRoundSeed] = useState(() => Date.now());
  const [round, setRound] = useState(() => buildDailyEarRound(snapshot.mastery, roundSeed));
  const [position, setPosition] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const complete = position >= round.length;
  const modes = useMemo(
    () => round.map((exercise) => presentationLabel(exercise.parameters.presentation)),
    [round]
  );

  const next = (correct: boolean) => {
    if (correct) setCorrectAnswers((current) => current + 1);
    setPosition((current) => current + 1);
  };

  const restart = () => {
    const nextSeed = roundSeed + 104_729;
    setRoundSeed(nextSeed);
    setRound(buildDailyEarRound(snapshot.mastery, nextSeed));
    setPosition(0);
    setCorrectAnswers(0);
  };

  if (complete)
    return (
      <section className="lesson-card ear-round-complete" aria-labelledby="ear-result-title">
        <p className="eyebrow">Dagens høretest er gennemført</p>
        <h2 id="ear-result-title">Du lyttede dig gennem alle tre former</h2>
        <strong className="ear-round-score">{correctAnswers}/3</strong>
        <p>
          Alle tre forsøg tæller som dagens indsats. Fejl er nyttige data: næste runde vælger først
          blandt de intervalformer, der har brug for mere arbejde.
        </p>
        <button className="button primary" type="button" onClick={restart}>
          Tag tre mere
        </button>
      </section>
    );

  return (
    <>
      <div className="ear-round-map" aria-label="Dagens tre intervalformer">
        {modes.map((mode, index) => (
          <span
            key={mode}
            className={index < position ? 'done' : index === position ? 'active' : ''}
          >
            {index < position ? '✓ ' : ''}
            {mode}
          </span>
        ))}
      </div>
      <IntervalQuestion
        key={round[position]!.id}
        exercise={round[position]!}
        position={position + 1}
        onComplete={next}
      />
    </>
  );
}
