import { Link } from 'react-router-dom';
import { useLearningData } from '../app/DataProvider';
import { subjects } from '../app/subjects';
import { StarMeter } from '../components/StarMeter';
import { ProgressRing } from '../design-system/ProgressRing';
import { FsrsScheduler } from '../learning/fsrs/scheduler';
import { attemptsOnDay, dailyStars, dailyStarTotal } from '../learning/gamification/dailyStars';
import { disciplineForLearningUnitId, learningCatalog } from '../learning/sessions/catalog';
import { selectDailySession } from '../learning/sessions/sessionSelector';
import type { DisciplineId } from '../learning/types';
import { PlayingCard } from '../modules/cards/PlayingCard';
import { CubeViewer } from '../modules/roux/CubeViewer';

const scheduler = new FsrsScheduler();

function SubjectVisual({ id }: { id: DisciplineId }) {
  if (id === 'doomsday')
    return (
      <div className="subject-visual calendar-mini">
        <span>AUG</span>
        <strong>23</strong>
        <small>SØNDAG</small>
      </div>
    );
  if (id === 'roux')
    return (
      <div className="subject-visual cube-mini">
        <CubeViewer compact />
      </div>
    );
  if (id === 'cards')
    return (
      <div className="subject-visual cards-mini">
        <PlayingCard card="7D" size="small" stacked />
        <PlayingCard card="5H" size="small" stacked />
      </div>
    );
  if (id === 'pi')
    return (
      <div className="subject-visual pi-mini">
        <span>3.</span>
        <strong>14159</strong>
        <i>26535</i>
        <small>89793…</small>
      </div>
    );
  return (
    <div className="subject-visual keys-mini" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6].map((key) => (
        <i key={key} />
      ))}
      <b />
      <b />
      <b />
    </div>
  );
}

function formatToday() {
  const formatter = new Intl.DateTimeFormat('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const text = formatter.format(new Date());
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function HomePage() {
  const { snapshot, ready } = useLearningData();
  const today = new Date();
  const due = snapshot.scheduledUnits.filter((card) => scheduler.isDue(card, today));
  const plan = selectDailySession({
    catalog: learningCatalog,
    scheduled: snapshot.scheduledUnits,
    mastery: snapshot.mastery,
    recentSessions: snapshot.sessions,
    focusWeights: snapshot.settings.focusWeights,
    targetMinutes: snapshot.settings.targetMinutes,
    now: today,
  });
  const estimatedMinutes = Math.max(
    1,
    Math.round(plan.reduce((sum, unit) => sum + unit.estimatedSeconds, 0) / 60)
  );
  const attemptsToday = attemptsOnDay(snapshot.attempts, today);
  const starsToday = dailyStarTotal(snapshot.attempts, today);
  const masteredByDiscipline = (id: DisciplineId) => {
    const records = snapshot.mastery.filter((item) => item.discipline === id);
    return records.length
      ? records.reduce((sum, item) => sum + item.strength, 0) / records.length
      : 0;
  };

  return (
    <div className="page home-page">
      <section className="today-hero">
        <div className="hero-copy">
          <p className="eyebrow">{formatToday()}</p>
          <h1>Godmorgen, Peter.</h1>
          <p className="hero-lead">
            En lille, skarp træning er klar. I dag lægger vi vægten dér, hvor hukommelsen har mest
            brug for dig.
          </p>
          <Link className="button start-button" to="/session">
            <span>Start dagens træning</span>
            <small>
              {ready
                ? `${estimatedMinutes} min · ${plan.length} læringsenheder`
                : 'Beregner dagens rytme…'}
            </small>
            <b aria-hidden="true">→</b>
          </Link>
        </div>
        <div className="today-state">
          <div className="pulse-orbit">
            <ProgressRing
              value={plan.length ? attemptsToday.length / plan.length : 0}
              label="Dagens session"
            />
          </div>
          <dl>
            <div>
              <dt>Til repetition</dt>
              <dd>{due.length}</dd>
            </div>
            <div>
              <dt>Dagens stjerner</dt>
              <dd>{starsToday}/15</dd>
            </div>
            <div>
              <dt>Ny læring i planen</dt>
              <dd>
                {
                  plan.filter(
                    (unit) =>
                      !snapshot.scheduledUnits.some((card) => card.learningUnitId === unit.id)
                  ).length
                }
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="section-heading">
        <div>
          <p className="eyebrow">Fem spor · én læringsmotor</p>
          <h2>Vælg et fag direkte</h2>
        </div>
        <Link to="/fag">
          Se alle fag <span>→</span>
        </Link>
      </section>
      <section className="subject-grid">
        {subjects.map((subject) => {
          const progress = masteredByDiscipline(subject.id);
          const subjectDue = due.filter(
            (card) => disciplineForLearningUnitId(card.learningUnitId) === subject.id
          ).length;
          const subjectStars = dailyStars(snapshot.attempts, subject.id, today);
          const copy = (
            <div className="subject-card-copy">
              <p className="eyebrow">{subject.eyebrow}</p>
              <h3>{subject.title}</h3>
              <p>{subject.description}</p>
              <footer>
                <StarMeter stars={subjectStars} compact />
                <span>{progress ? `${Math.round(progress * 100)}% styrke` : 'Ikke startet'}</span>
                <span>{subjectDue ? `${subjectDue} klar nu` : 'Direkte træning'}</span>
              </footer>
            </div>
          );
          if (subject.id === 'roux') {
            return (
              <article key={subject.id} className={`subject-card ${subject.accent}`}>
                <Link className="subject-card-link" to={subject.route}>
                  {copy}
                </Link>
                <SubjectVisual id={subject.id} />
              </article>
            );
          }
          return (
            <Link key={subject.id} to={subject.route} className={`subject-card ${subject.accent}`}>
              {copy}
              <SubjectVisual id={subject.id} />
            </Link>
          );
        })}
      </section>
      <section className="privacy-note">
        <span aria-hidden="true">⌁</span>
        <div>
          <strong>Din læring bliver på enheden</strong>
          <p>Fremskridt gemmes lokalt i IndexedDB. Ingen konto, analyse eller tracking.</p>
        </div>
        <Link to="/indstillinger">Backup data</Link>
      </section>
    </div>
  );
}
