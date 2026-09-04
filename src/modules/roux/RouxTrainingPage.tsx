import { useState } from 'react';
import { Link } from 'react-router-dom';
import { physicalCubeAdapter } from '../../hardware/smartcube/physicalCube';
import type { SmartCubeAdapter } from '../../hardware/smartcube/types';
import { RouxQuickSolvePanel } from './RouxQuickSolvePanel';
import { RouxStartCube } from './RouxStartCube';

const phases = [
  {
    number: '01',
    title: 'First Block',
    goal: 'Byg den orange-gule blok til venstre.',
    learn: 'Din live-cube står ved siden af hvert 3D-delmål.',
    meta: 'Intuitiv · ingen faste algoritmer',
    route: '/fag/roux/first-block',
    action: 'Start fase 1',
  },
  {
    number: '02',
    title: 'Second Block',
    goal: 'Byg den røde-gule blok til højre.',
    learn: 'Beskyt den første blok, og brug toppen som arbejdsbord.',
    meta: '2 korte værktøjer',
    route: '/fag/roux/second-block',
    action: 'Start fase 2',
  },
  {
    number: '03',
    title: 'Begynder-CMLL',
    goal: 'Vend og placér de fire hvide hjørner.',
    learn: 'Orientér først; find derefter forlygter og placér hjørnerne.',
    meta: '2 kig · 2 algoritmer',
    route: '/fag/roux/cmll',
    action: 'Start fase 3',
  },
  {
    number: '04',
    title: 'Last Six Edges',
    goal: 'Løs de sidste seks kanter og hele cuben.',
    learn: 'EO, L/R-kanterne og de sidste fire kanter som tre små delmål.',
    meta: 'Kun M og U · 2 mønstre',
    route: '/fag/roux/lse',
    action: 'Start fase 4',
  },
] as const;

export function RouxTrainingPage({
  cubeAdapter = physicalCubeAdapter,
}: {
  cubeAdapter?: SmartCubeAdapter;
}) {
  const [rightPanel, setRightPanel] = useState<'phases' | 'solve'>('phases');

  return (
    <div className="page roux-training-page roux-workbench-page">
      <header className="roux-workbench-heading">
        <div>
          <p className="eyebrow">Roux</p>
          <h1>Træn med din cube</h1>
          <p>Forbind til venstre. Vælg en af de fire faser til højre.</p>
        </div>
        <Link className="button secondary" to="/fag/roux/notation">
          Hjælp
        </Link>
      </header>

      <div className="roux-workbench">
        <aside className="roux-workbench-cube-column">
          <RouxStartCube adapter={cubeAdapter} onQuickSolve={() => setRightPanel('solve')} />
        </aside>

        <div className="roux-workbench-main">
          {rightPanel === 'solve' ? (
            <RouxQuickSolvePanel adapter={cubeAdapter} onClose={() => setRightPanel('phases')} />
          ) : (
            <section className="roux-phase-picker" aria-labelledby="training-path-title">
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
                    <Link to={phase.route} aria-label={`${phase.action}: ${phase.title}`}>
                      <b>{phase.number}</b>
                      <div>
                        <small>Fasens mål</small>
                        <h3>{phase.title}</h3>
                        <strong>{phase.goal}</strong>
                        <p>{phase.learn}</p>
                        <span>{phase.meta}</span>
                      </div>
                      <i aria-hidden="true">→</i>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>

      <p className="roux-workbench-note">
        Første Bluetooth-godkendelse styres af browseren. Når cuben først er godkendt, forsøger
        PeterLingo automatisk at genforbinde den uden et nyt valg.
      </p>
    </div>
  );
}
