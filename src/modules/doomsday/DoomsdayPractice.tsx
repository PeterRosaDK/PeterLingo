import { useMemo, useState } from 'react';
import { useLearningData } from '../../app/DataProvider';
import { ExerciseShell } from '../../components/ExerciseShell';
import { createHintProgress, revealNextHint } from '../../learning/hints/hintProgress';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import {
  DOOMSDAY_SKILLS,
  getDoomsdaySkill,
  masteryLabel,
  recommendDoomsdaySkill,
  type DoomsdaySkill,
  type DoomsdaySkillId,
} from './curriculum';
import { createDoomsdayExercise } from './exercises';

function DoomsdayExercisePanel({ skill }: { skill: DoomsdaySkill }) {
  const { snapshot } = useLearningData();
  const [seed, setSeed] = useState(() => Date.now());
  const exercise = useMemo(() => createDoomsdayExercise(skill.id, seed), [seed, skill.id]);
  const [hints, setHints] = useState(() => createHintProgress(exercise.hints));
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const { record, restartTimer } = useAttemptRecorder(exercise);
  const mastery = snapshot.mastery.find((item) => item.learningUnitId === skill.learningUnitId);

  const answer = async (value: number) => {
    if (feedback) return;
    const correct = value === exercise.parameters.answer;
    setFeedback({
      correct,
      text: correct ? `Korrekt. ${exercise.explanation}` : `Ikke helt. ${exercise.explanation}`,
    });
    await record({
      correct,
      hintsUsed: hints.used,
      answerRevealed: hints.answerRevealed,
      stage: mastery?.stage ?? 'teaching',
      fluentThresholdMs: skill.fluentThresholdMs,
    });
  };

  const next = () => {
    const nextSeed = seed + 97_531;
    const nextExercise = createDoomsdayExercise(skill.id, nextSeed);
    setSeed(nextSeed);
    setHints(createHintProgress(nextExercise.hints));
    setFeedback(null);
    restartTimer();
  };

  return (
    <ExerciseShell
      eyebrow={`Trin ${skill.number} · ${skill.shortTitle}`}
      title={exercise.prompt}
      hints={exercise.hints}
      hintProgress={hints}
      onHint={() => setHints((current) => revealNextHint(exercise.hints, current))}
    >
      <div className="doomsday-question-object" aria-hidden="true">
        <span>{exercise.visual.label}</span>
        <strong>{exercise.visual.primary}</strong>
        <small>{exercise.visual.secondary}</small>
      </div>

      <div
        className={`answer-grid doomsday-answers ${exercise.choices.length === 7 ? 'weekdays' : ''}`}
      >
        {exercise.choices.map((choice) => (
          <button
            key={`${choice.value}:${choice.label}`}
            type="button"
            onClick={() => void answer(choice.value)}
            disabled={Boolean(feedback)}
          >
            {choice.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'incorrect'}`} role="status">
          <span>{feedback.text}</span>
          <button className="button primary" type="button" onClick={next}>
            Ny opgave i samme trin
          </button>
        </div>
      )}
    </ExerciseShell>
  );
}

export function DoomsdayPractice() {
  const { snapshot } = useLearningData();
  const recommended = recommendDoomsdaySkill(snapshot.mastery, snapshot.scheduledUnits);
  const [selectedSkillId, setSelectedSkillId] = useState<DoomsdaySkillId | null>(null);
  const activeSkill = getDoomsdaySkill(selectedSkillId ?? recommended.id);
  const learned = DOOMSDAY_SKILLS.filter((skill) =>
    snapshot.mastery.some(
      (item) => item.learningUnitId === skill.learningUnitId && item.strength >= 0.68
    )
  ).length;

  return (
    <>
      <section className="lesson-card doomsday-curriculum" aria-labelledby="curriculum-title">
        <header>
          <div>
            <p className="eyebrow">Dit læringsforløb</p>
            <h2 id="curriculum-title">Ét sikkert trin ad gangen</h2>
            <p>
              PeterLingo anbefaler det næste trin ud fra dine tidligere svar. Du kan altid vælge et
              andet trin selv.
            </p>
          </div>
          <div className="curriculum-progress" aria-label={`${learned} af 6 trin lært`}>
            <strong>{learned}/6</strong>
            <span>på sikkert niveau</span>
          </div>
        </header>

        <div className="curriculum-grid" aria-label="Doomsday-trin">
          {DOOMSDAY_SKILLS.map((skill) => {
            const mastery = snapshot.mastery.find(
              (item) => item.learningUnitId === skill.learningUnitId
            );
            const isActive = skill.id === activeSkill.id;
            const isRecommended = skill.id === recommended.id;
            return (
              <button
                key={skill.id}
                type="button"
                className={`curriculum-step ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
                onClick={() => setSelectedSkillId(skill.id)}
              >
                <b>{skill.number}</b>
                <span>
                  <strong>{skill.title}</strong>
                  <small>{skill.description}</small>
                  <i>{masteryLabel(mastery?.stage)}</i>
                </span>
                {isRecommended && <em>Anbefalet</em>}
              </button>
            );
          })}
        </div>
      </section>

      <DoomsdayExercisePanel key={activeSkill.id} skill={activeSkill} />
    </>
  );
}
