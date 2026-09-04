import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLearningData } from '../app/DataProvider';
import { subjectById } from '../app/subjects';
import {
  dailySessionProgress,
  dailySessionReason,
  dailySessionReasonLabels,
  localDateKey,
} from '../learning/sessions/sessionInsights';
import { learningStageLabel } from '../learning/stages';
import { learningCatalog } from '../learning/sessions/catalog';
import {
  resolveLearningUnits,
  selectDailySession,
  type SessionSelectionInput,
} from '../learning/sessions/sessionSelector';

const unitRoute = (unit: { discipline: string; id: string }) =>
  unit.id.startsWith('roux:lse')
    ? '/fag/roux/lse'
    : unit.id.startsWith('roux:cmll')
      ? '/fag/roux/cmll'
      : unit.id.startsWith('roux:second-block')
        ? '/fag/roux/second-block'
        : unit.id.startsWith('roux:first-block')
          ? '/fag/roux/first-block'
          : unit.discipline === 'cards'
            ? '/fag/kort'
            : unit.discipline === 'music-ear'
              ? '/fag/hoerelaere'
              : `/fag/${unit.discipline}`;

function ReadySessionPage() {
  const { snapshot, repository, refresh } = useLearningData();
  const [now] = useState(() => new Date());
  const sessionId = `daily:${localDateKey(now)}`;
  const selectionInput: SessionSelectionInput = {
    catalog: learningCatalog,
    scheduled: snapshot.scheduledUnits,
    mastery: snapshot.mastery,
    recentSessions: snapshot.sessions,
    focusWeights: snapshot.settings.focusWeights,
    attempts: snapshot.attempts,
    targetMinutes: snapshot.settings.targetMinutes,
    now,
  };
  const existingSession = snapshot.sessions.find((session) => session.id === sessionId);
  const savedPlan = existingSession
    ? resolveLearningUnits(selectionInput, existingSession.plannedUnitIds)
    : [];
  const plan = savedPlan.length ? savedPlan : selectDailySession(selectionInput);
  const progress = dailySessionProgress(plan, snapshot.attempts, now);
  const nextUnit = plan.find((unit) => !progress.completedUnitIds.includes(unit.id));
  const startedAt = existingSession?.startedAt ?? now.toISOString();
  const completedAt = progress.complete
    ? (existingSession?.completedAt ?? now.toISOString())
    : undefined;
  const plannedUnitIdsKey = plan.map((unit) => unit.id).join('|');
  const completedAttemptIdsKey = progress.completedAttemptIds.join('|');
  const needsSave =
    !existingSession ||
    existingSession.plannedUnitIds.join('|') !== plannedUnitIdsKey ||
    existingSession.completedAttemptIds.join('|') !== completedAttemptIdsKey ||
    existingSession.completedAt !== completedAt;

  useEffect(() => {
    if (!needsSave) return;
    void repository
      .saveSession({
        id: sessionId,
        startedAt,
        plannedUnitIds: plannedUnitIdsKey ? plannedUnitIdsKey.split('|') : [],
        completedAttemptIds: completedAttemptIdsKey ? completedAttemptIdsKey.split('|') : [],
        ...(completedAt ? { completedAt } : {}),
      })
      .then(refresh);
  }, [
    completedAt,
    completedAttemptIdsKey,
    needsSave,
    plannedUnitIdsKey,
    refresh,
    repository,
    sessionId,
    startedAt,
  ]);

  const seconds = plan.reduce((sum, unit) => sum + unit.estimatedSeconds, 0);
  return (
    <div className="page session-page">
      <header className="page-heading">
        <p className="eyebrow">Dagens træning</p>
        <h1>
          {progress.complete
            ? 'Dagens plan er i mål'
            : `${plan.length - progress.completedCount} af ${plan.length} stop tilbage`}
        </h1>
        <p>
          {progress.completedCount ? `${progress.completedCount} gennemført. ` : ''}
          Omtrent {Math.max(1, Math.round(seconds / 60))} minutter i alt, kalibreret forsigtigt
          efter dine faktiske svartider. Rækkefølgen følger behov, ikke en fast femtedel.
        </p>
      </header>
      <ol className="session-plan">
        {plan.map((unit, index) => {
          const subject = subjectById(unit.discipline);
          const completed = progress.completedUnitIds.includes(unit.id);
          const reason = dailySessionReason(unit, snapshot.scheduledUnits, snapshot.mastery, now);
          return (
            <li key={unit.id} className={completed ? 'completed' : ''}>
              <b>{completed ? '✓' : String(index + 1).padStart(2, '0')}</b>
              <span className={`subject-dot ${subject.accent}`} />
              <div>
                <small>
                  {subject.title} · {learningStageLabel(unit.stage)}
                </small>
                <strong>{unit.title}</strong>
                <small className="session-reason">{dailySessionReasonLabels[reason]}</small>
              </div>
              <time>
                {completed ? 'Gennemført' : `ca. ${Math.ceil(unit.estimatedSeconds / 60)} min`}
              </time>
            </li>
          );
        })}
      </ol>
      {progress.complete ? (
        <section className="session-complete" aria-live="polite">
          <span aria-hidden="true">★</span>
          <div>
            <p className="eyebrow">Dagens session gennemført</p>
            <h2>Godt arbejde — planen er lukket.</h2>
            <p>
              {progress.attemptCount} forsøg på {plan.length} læringsenheder;{' '}
              {progress.correctCount} endte korrekt.{' '}
              {progress.hintsUsed === 0
                ? 'Du gennemførte uden hints.'
                : `Du brugte hints ${progress.hintsUsed} gange.`}{' '}
              Fejl og hjælp tæller stadig som reelt træningsarbejde.
            </p>
          </div>
          <Link className="button secondary" to="/">
            Til forsiden
          </Link>
        </section>
      ) : nextUnit ? (
        <Link className="button start-button compact-start" to={unitRoute(nextUnit)}>
          <span>
            {progress.completedCount ? 'Fortsæt med næste øvelse' : 'Begynd første øvelse'}
          </span>
          <small>
            {subjectById(nextUnit.discipline).title} · {nextUnit.title}
          </small>
          <b>→</b>
        </Link>
      ) : (
        <p>Der er ikke noget planlagt endnu.</p>
      )}
    </div>
  );
}

export function SessionPage() {
  const { ready } = useLearningData();
  if (!ready) return <div className="page session-page">Beregner dagens rytme …</div>;
  return <ReadySessionPage />;
}
