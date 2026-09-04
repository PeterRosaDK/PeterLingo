import { Link } from 'react-router-dom';
import { RouxStartCube } from './RouxStartCube';

const phases = [
  {
    number: '01',
    title: 'First Block',
    goal: 'Byg den orange-gule blok til venstre.',
    learn: 'Find brikker, saml et par, og gør en firkant til en 1×2×3-blok.',
    meta: 'Intuitiv · ingen faste algoritmer',
    route: '/fag/roux/first-block',
    action: 'Start med First Block',
  },
  {
    number: '02',
    title: 'Second Block',
    goal: 'Byg den røde-gule blok til højre.',
    learn: 'Beskyt den første blok, og brug toppen som arbejdsbord.',
    meta: '2 korte værktøjer',
    route: '/fag/roux/second-block',
    action: 'Øv Second Block',
  },
  {
    number: '03',
    title: 'Begynder-CMLL',
    goal: 'Vend og placér de fire hvide hjørner.',
    learn: 'Orientér først; find derefter forlygter og placér hjørnerne.',
    meta: '2 kig · 2 algoritmer',
    route: '/fag/roux/cmll',
    action: 'Øv CMLL',
  },
  {
    number: '04',
    title: 'Last Six Edges',
    goal: 'Løs de sidste seks kanter og hele cuben.',
    learn: 'Tag EO, L/R-kanterne og de sidste fire kanter som tre små delmål.',
    meta: 'Kun M og U · 2 mønstre',
    route: '/fag/roux/lse',
    action: 'Øv LSE',
  },
] as const;

export function RouxTrainingPage() {
  return (
    <div className="page roux-training-page">
      <header className="roux-training-hero roux-training-heading">
        <div className="page-heading">
          <p className="eyebrow">Roux · træning</p>
          <h1>Én fase ad gangen</h1>
          <p>
            Hold hvid/GO op og grøn mod dig. Vælg den fase, du vil lære; hver side forklarer først
            målet og åbner derefter den fysiske øvelse.
          </p>
          <div className="button-row">
            <Link className="button primary" to="/fag/roux/first-block">
              Start helt fra begyndelsen
            </Link>
            <Link className="button secondary" to="/fag/roux/notation">
              Hjælp
            </Link>
            <Link className="button secondary" to="/fag/roux/opsaetning">
              Opsætning
            </Link>
          </div>
        </div>
        <RouxStartCube />
      </header>

      <section className="roux-training-path" aria-labelledby="training-path-title">
        <div className="stage-heading">
          <div>
            <p className="eyebrow">Dit begynderforløb</p>
            <h2 id="training-path-title">De fire Roux-faser</h2>
          </div>
          <span className="status-pill good">Alle fire er åbne</span>
        </div>
        <ol>
          {phases.map((phase) => (
            <li key={phase.number}>
              <b>{phase.number}</b>
              <div>
                <small>Fasens mål</small>
                <h3>{phase.title}</h3>
                <strong>{phase.goal}</strong>
                <p>{phase.learn}</p>
                <span>{phase.meta}</span>
              </div>
              <Link className="button secondary" to={phase.route}>
                {phase.action}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="roux-training-footer">
        <p>Skal cuben forbindes eller løses først?</p>
        <Link className="button secondary" to="/fag/roux/opsaetning">
          Gå til Opsætning
        </Link>
      </div>
    </div>
  );
}
