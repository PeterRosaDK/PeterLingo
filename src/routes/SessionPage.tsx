import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLearningData } from '../app/DataProvider';
import { subjectById } from '../app/subjects';
import { learningCatalog } from '../learning/sessions/catalog';
import { selectDailySession } from '../learning/sessions/sessionSelector';

const unitRoute = (discipline: string) =>
  discipline === 'cards'
    ? '/fag/kort'
    : discipline === 'music-ear'
      ? '/fag/musikoere'
      : `/fag/${discipline}`;

export function SessionPage() {
  const { snapshot, repository, refresh } = useLearningData();
  const plan = selectDailySession({
    catalog: learningCatalog,
    scheduled: snapshot.scheduledUnits,
    mastery: snapshot.mastery,
    recentSessions: snapshot.sessions,
    focusWeights: snapshot.settings.focusWeights,
    targetMinutes: snapshot.settings.targetMinutes,
  });
  const sessionId = `daily:${new Date().toISOString().slice(0, 10)}`;
  useEffect(() => {
    void repository
      .saveSession({
        id: sessionId,
        startedAt: new Date().toISOString(),
        plannedUnitIds: plan.map((unit) => unit.id),
        completedAttemptIds:
          snapshot.sessions.find((session) => session.id === sessionId)?.completedAttemptIds ?? [],
      })
      .then(refresh);
    // The plan is deliberately captured when this screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository, sessionId]);
  const seconds = plan.reduce((sum, unit) => sum + unit.estimatedSeconds, 0);
  return (
    <div className="page session-page">
      <header className="page-heading">
        <p className="eyebrow">Dagens træning</p>
        <h1>{plan.length} fokuserede stop</h1>
        <p>
          Omtrent {Math.max(1, Math.round(seconds / 60))} minutter. Rækkefølgen blander emner efter
          behov, ikke efter en fast femtedel.
        </p>
      </header>
      <ol className="session-plan">
        {plan.map((unit, index) => {
          const subject = subjectById(unit.discipline);
          return (
            <li key={unit.id}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              <span className={`subject-dot ${subject.accent}`} />
              <div>
                <small>
                  {subject.title} · {unit.stage}
                </small>
                <strong>{unit.title}</strong>
              </div>
              <time>{Math.ceil(unit.estimatedSeconds / 60)} min</time>
            </li>
          );
        })}
      </ol>
      {plan[0] ? (
        <Link className="button start-button compact-start" to={unitRoute(plan[0].discipline)}>
          <span>Begynd første øvelse</span>
          <small>
            {subjectById(plan[0].discipline).title} · {plan[0].title}
          </small>
          <b>→</b>
        </Link>
      ) : (
        <p>Der er ikke noget planlagt endnu.</p>
      )}
    </div>
  );
}
