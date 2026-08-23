import { useMemo, useState } from 'react';
import { useLearningData } from '../../app/DataProvider';
import { ExerciseShell } from '../../components/ExerciseShell';
import { createHintProgress, revealNextHint } from '../../learning/hints/hintProgress';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import {
  CARDS_SKILLS,
  cardsSkillStatus,
  cardsSkillStrength,
  getCardsSkill,
  recommendCardsSkill,
  type CardsSkill,
  type CardsSkillId,
} from './curriculum';
import { createCardsExercise, recommendMbcTarget } from './exercises';
import { PlayingCard } from './PlayingCard';

function CardsExercisePanel({ skill }: { skill: CardsSkill }) {
  const { snapshot } = useLearningData();
  const [seed, setSeed] = useState(() => Date.now());
  const [targetIndex, setTargetIndex] = useState(() =>
    recommendMbcTarget(skill.id, snapshot.mastery, snapshot.scheduledUnits, seed)
  );
  const exercise = useMemo(
    () => createCardsExercise(skill.id, seed, targetIndex),
    [seed, skill.id, targetIndex]
  );
  const [hints, setHints] = useState(() => createHintProgress(exercise.hints));
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const { record, restartTimer } = useAttemptRecorder(exercise);
  const mastery = snapshot.mastery.find((item) => item.learningUnitId === exercise.learningUnitId);

  const answer = async (value: string) => {
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
    const nextSeed = seed + 65_537;
    const nextTarget = recommendMbcTarget(
      skill.id,
      snapshot.mastery,
      snapshot.scheduledUnits,
      nextSeed
    );
    const nextExercise = createCardsExercise(skill.id, nextSeed, nextTarget);
    setSeed(nextSeed);
    setTargetIndex(nextTarget);
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
      {exercise.visual.card ? (
        <div className="cards-practice-visual">
          <PlayingCard card={exercise.visual.card} size="large" dealt />
          <div>
            <span>{exercise.visual.label}</span>
            <strong>{exercise.visual.primary}</strong>
            <small>{exercise.visual.secondary}</small>
          </div>
        </div>
      ) : (
        <div className="cards-number-object" aria-hidden="true">
          <span>{exercise.visual.label}</span>
          <strong>{exercise.visual.primary}</strong>
          <small>{exercise.visual.secondary}</small>
        </div>
      )}

      {exercise.choices.some((choice) => choice.card) ? (
        <div className="card-choices">
          {exercise.choices.map((choice) => (
            <button
              key={choice.value}
              type="button"
              onClick={() => void answer(choice.value)}
              disabled={Boolean(feedback)}
              aria-label={`Vælg ${choice.label}`}
            >
              <PlayingCard card={choice.card!} size="medium" />
            </button>
          ))}
        </div>
      ) : (
        <div className="answer-grid cards-text-answers">
          {exercise.choices.map((choice) => (
            <button
              key={choice.value}
              type="button"
              onClick={() => void answer(choice.value)}
              disabled={Boolean(feedback)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}

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

export function CardsPractice() {
  const { snapshot, ready } = useLearningData();
  const recommended = recommendCardsSkill(snapshot.mastery, snapshot.scheduledUnits);
  const [selectedSkillId, setSelectedSkillId] = useState<CardsSkillId | null>(null);
  const activeSkill = getCardsSkill(selectedSkillId ?? recommended.id);
  const learned = CARDS_SKILLS.filter(
    (skill) => (cardsSkillStrength(skill, snapshot.mastery) ?? 0) >= 0.68
  ).length;

  if (!ready)
    return (
      <section className="lesson-card" aria-live="polite">
        Åbner din korttræning …
      </section>
    );

  return (
    <>
      <section className="lesson-card cards-curriculum" aria-labelledby="cards-curriculum-title">
        <header>
          <div>
            <p className="eyebrow">Fra system til hukommelse</p>
            <h2 id="cards-curriculum-title">BCS først — MBCS bagefter</h2>
            <p>
              PeterLingo holder regnereglen, baglæns rækkefølge og de to kort-position-forbindelser
              adskilt, så et sikkert svar i én retning ikke skjuler et hul i en anden.
            </p>
          </div>
          <div
            className="curriculum-progress coral-progress"
            aria-label={`${learned} af 10 trin lært`}
          >
            <strong>{learned}/10</strong>
            <span>på sikkert niveau</span>
          </div>
        </header>

        <div className="curriculum-grid cards-curriculum-grid" aria-label="BCS- og MBCS-trin">
          {CARDS_SKILLS.map((skill) => {
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
                  <i>{cardsSkillStatus(skill, snapshot.mastery)}</i>
                </span>
                {isRecommended && <em>Anbefalet</em>}
              </button>
            );
          })}
        </div>
      </section>

      <CardsExercisePanel key={activeSkill.id} skill={activeSkill} />
    </>
  );
}
