import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import type { CubeMove, CubeState } from '../../hardware/smartcube/types';
import { isFixedLeftFirstBlockSolved } from '../../hardware/smartcube/state';
import { CubeViewer } from './CubeViewer';

const moves = ['R', "R'", 'U', "U'", 'L', "L'", 'M', "M'"];

export function RouxPage() {
  const [adapter] = useState(() => new MockSmartCubeAdapter());
  const [cubeState, setCubeState] = useState<CubeState>(() => adapter.getCubeState());
  const [history, setHistory] = useState<CubeMove[]>([]);

  useEffect(() => {
    void adapter.connect();
    const unsubscribeMove = adapter.subscribeToMoves((move) =>
      setHistory((current) => [...current, move])
    );
    const unsubscribeState = adapter.subscribeToState((state) => setCubeState(state));
    return () => {
      unsubscribeMove();
      unsubscribeState();
      void adapter.disconnect();
    };
  }, [adapter]);

  const reset = () => {
    adapter.reset();
    setHistory([]);
  };
  const firstBlock = cubeState.facelets ? isFixedLeftFirstBlockSolved(cubeState.facelets) : null;

  return (
    <div className="page subject-page roux-page">
      <header className="subject-hero ice">
        <div>
          <p className="eyebrow">Intuition før algoritmer</p>
          <h1>Roux</h1>
          <p>Byg venstre blok, højre blok og løs resten med så få udenadsting som muligt.</p>
        </div>
        <div className="cube-hero">
          <CubeViewer compact />
        </div>
      </header>
      <div className="roux-layout">
        <section className="cube-stage">
          <div className="stage-heading">
            <div>
              <p className="eyebrow">Softwareklar mock-terning</p>
              <h2>Prøv live state-plumbing</h2>
            </div>
            <span className="status-pill good">Forbundet · mock</span>
          </div>
          <CubeViewer algorithm={cubeState.algorithm} />
          <div className="move-pad" aria-label="Mock-træk">
            {moves.map((move) => (
              <button type="button" key={move} onClick={() => adapter.emitMove(move)}>
                {move}
              </button>
            ))}
            <button type="button" className="reset-move" onClick={reset}>
              Nulstil
            </button>
          </div>
        </section>
        <aside className="roux-progress">
          <p className="eyebrow">Læringsrækkefølge</p>
          <ol>
            <li className="active">
              <b>01</b>
              <div>
                <strong>First Block</strong>
                <span>Find par og byg 1×2×3 intuitivt.</span>
              </div>
            </li>
            <li>
              <b>02</b>
              <div>
                <strong>Second Block</strong>
                <span>Bevar friheden omkring M-laget.</span>
              </div>
            </li>
            <li>
              <b>03</b>
              <div>
                <strong>Begynderhjørner</strong>
                <span>To-look før fuld CMLL.</span>
              </div>
            </li>
            <li>
              <b>04</b>
              <div>
                <strong>Last Six Edges</strong>
                <span>Orientér og afslut.</span>
              </div>
            </li>
          </ol>
          <div className="goal-state">
            <span>Fast venstre First Block</span>
            <strong>
              {firstBlock === true
                ? 'Genkendt'
                : firstBlock === false
                  ? 'Ikke løst'
                  : 'Afventer fuld state'}
            </strong>
            <small>Detektoren bruger en dokumenteret fast URFDLB-orientering.</small>
          </div>
        </aside>
      </div>
      <section className="hardware-callout">
        <div>
          <p className="eyebrow">Fysisk GoCube</p>
          <h2>Transporten er bygget — den fysiske prøve mangler</h2>
          <p>
            Diagnostikken viser browser, Beacio, batteri, moves, facelets og synkronisering uden at
            gøre resten af PeterLingo afhængig af Bluetooth.
          </p>
        </div>
        <Link className="button primary" to="/fag/roux/diagnostik">
          Åbn GoCube-diagnostik
        </Link>
      </section>
      <section className="move-history">
        <h2>Trækhistorik</h2>
        <div>
          {history.length ? (
            history.map((move, index) => (
              <span key={`${move.timestamp}-${index}`}>{move.notation}</span>
            ))
          ) : (
            <p>Tryk på et mock-træk ovenfor.</p>
          )}
        </div>
      </section>
    </div>
  );
}
