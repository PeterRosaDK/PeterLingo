import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionState, CubeState, SmartCubeAdapter } from '../../hardware/smartcube/types';
import { describeMove, solveFacelets, validateFacelets, type CubeSolution } from './faceletSolver';
import { consumeLiveMove, type PendingHalfTurn } from './liveSolutionTracking';

const COLOR_NAMES: Record<string, string> = {
  U: 'hvid',
  R: 'rød',
  F: 'grøn',
  D: 'gul',
  L: 'orange',
  B: 'blå',
};

export function RouxQuickSolvePanel({
  adapter,
  onClose,
  faceletsOverride = null,
}: {
  adapter: SmartCubeAdapter;
  onClose(): void;
  faceletsOverride?: string | null;
}) {
  const [connection, setConnection] = useState<ConnectionState>(() =>
    faceletsOverride ? 'disconnected' : adapter.getConnectionState()
  );
  const [status, setStatus] = useState<'working' | 'ready' | 'error'>('working');
  const [message, setMessage] = useState('Beregner den korteste sikre redningsvej …');
  const [trackingMessage, setTrackingMessage] = useState('');
  const [solution, setSolution] = useState<CubeSolution | null>(null);
  const [completedMoves, setCompletedMoves] = useState(0);
  const solveRequest = useRef(0);
  const solutionRef = useRef<CubeSolution | null>(null);
  const completedMovesRef = useRef(0);
  const pendingHalfTurn = useRef<PendingHalfTurn | null>(null);

  const calculate = useCallback(async (state: CubeState | null, replanning = false) => {
    const facelets = state?.facelets ?? null;
    if (!facelets || !validateFacelets(facelets).ok) {
      setStatus('error');
      setMessage('GoCube har endnu ikke sendt en fuld, fysisk mulig tilstand.');
      return;
    }
    const request = ++solveRequest.current;
    setStatus('working');
    setMessage(
      replanning ? 'Tilpasser løsningen til cubens nye tilstand …' : 'Beregner løsningen …'
    );
    setSolution(null);
    solutionRef.current = null;
    setCompletedMoves(0);
    completedMovesRef.current = 0;
    pendingHalfTurn.current = null;
    try {
      const nextSolution = await solveFacelets(facelets);
      if (request !== solveRequest.current) return;
      setSolution(nextSolution);
      solutionRef.current = nextSolution;
      setStatus('ready');
      setMessage(
        nextSolution.moves.length
          ? `${nextSolution.moves.length} træk. GoCube går automatisk videre efter hvert korrekt træk.`
          : 'Cuben er allerede løst.'
      );
    } catch (error) {
      if (request !== solveRequest.current) return;
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Løsningen kunne ikke beregnes.');
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(
      () =>
        void calculate(
          faceletsOverride
            ? {
                facelets: faceletsOverride,
                algorithm: '',
                moveCount: 0,
                synchronization: 'synchronized',
              }
            : adapter.getCubeState()
        ),
      0
    );
    if (faceletsOverride) {
      return () => window.clearTimeout(initialTimer);
    }
    const inspectState = () => {
      const nextConnection = adapter.getConnectionState();
      setConnection(nextConnection);
    };
    const offMove = adapter.subscribeToMoves((move) => {
      const activeSolution = solutionRef.current;
      const moveIndex = completedMovesRef.current;
      const expected = activeSolution?.moves[moveIndex];
      if (!activeSolution || !expected) return;
      const result = consumeLiveMove(expected, move.notation, pendingHalfTurn.current);
      pendingHalfTurn.current = result.pending;
      if (result.status === 'matched') {
        const nextIndex = Math.min(activeSolution.moves.length, moveIndex + 1);
        completedMovesRef.current = nextIndex;
        setCompletedMoves(nextIndex);
        setTrackingMessage(
          nextIndex === activeSolution.moves.length
            ? 'Alle løsningens træk er registreret.'
            : `Godt. Klar til træk ${nextIndex + 1}.`
        );
      } else if (result.status === 'halfway') {
        setTrackingMessage('Første kvartdrejning registreret. Fortsæt samme vej til 180°.');
      } else if (result.status === 'cancelled') {
        setTrackingMessage('De to drejninger ophævede hinanden. Prøv halvgangen igen.');
      } else {
        setTrackingMessage('Et andet træk blev registreret. Ruten beregnes på ny …');
        window.setTimeout(() => void calculate(adapter.getCubeState(), true), 0);
      }
    });
    const offState = adapter.subscribeToState?.(inspectState);
    inspectState();
    return () => {
      window.clearTimeout(initialTimer);
      offMove();
      offState?.();
    };
  }, [adapter, calculate, faceletsOverride]);

  const currentMove = solution?.moves[completedMoves] ?? '';
  const currentFace = currentMove[0] ?? 'U';
  const currentTurnSymbol = currentMove.endsWith('2')
    ? '↻↻'
    : currentMove.endsWith("'")
      ? '↺'
      : '↻';
  const complete = Boolean(solution && completedMoves >= solution.moves.length);

  return (
    <section className="roux-quick-solve" aria-labelledby="quick-solve-title">
      <header className="stage-heading">
        <div>
          <p className="eyebrow">Løs hurtigt</p>
          <h2 id="quick-solve-title">Følg ét træk ad gangen</h2>
        </div>
        <button type="button" className="button secondary compact" onClick={onClose}>
          Tilbage til faserne
        </button>
      </header>

      <p className={`solve-message ${status}`} role="status">
        {message}
      </p>

      {solution && (
        <>
          <div className="quick-solve-progress-heading">
            <strong>
              {completedMoves}/{solution.moves.length} træk
            </strong>
            <span className={`status-pill ${connection === 'connected' ? 'good' : ''}`}>
              {connection === 'connected' ? 'GoCube følger med' : 'Manuel fremdrift'}
            </span>
          </div>
          <div className="solve-progress" aria-label="Løsningsfremskridt">
            <span
              style={{ width: `${(completedMoves / Math.max(solution.moves.length, 1)) * 100}%` }}
            />
          </div>

          {complete ? (
            <div className="cube-solved-message">
              <strong>Cuben er løst</strong>
              <p>Alle træk er gennemført. Du kan gå direkte tilbage til træningsfaserne.</p>
            </div>
          ) : (
            <div className="quick-solve-current-step">
              <div className={`solve-face color-${currentFace}`} aria-hidden="true">
                {currentTurnSymbol}
              </div>
              <div>
                <p className="eyebrow">
                  Næste træk · {completedMoves + 1} af {solution.moves.length}
                </p>
                <h3>{COLOR_NAMES[currentFace]} side</h3>
                <p>{describeMove(currentMove)}</p>
                <small>Notation: {currentMove}</small>
              </div>
            </div>
          )}

          <p className="quick-solve-tracking" aria-live="polite">
            {trackingMessage ||
              (connection === 'connected'
                ? 'Lav trækket på cuben; næste trin vises automatisk.'
                : 'Brug knapperne til at følge løsningen uden live-forbindelse.')}
          </p>

          {connection !== 'connected' && !complete && (
            <div className="button-row">
              <button
                type="button"
                className="button secondary"
                disabled={completedMoves === 0}
                onClick={() => setCompletedMoves((current) => Math.max(0, current - 1))}
              >
                Forrige træk
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() =>
                  setCompletedMoves((current) => Math.min(solution.moves.length, current + 1))
                }
              >
                Jeg har lavet trækket
              </button>
            </div>
          )}

          <details className="quick-solve-algorithm">
            <summary>Vis hele trækrækken</summary>
            <div aria-label="Hele løsningens algoritme">
              {solution.moves.map((move, index) => (
                <span
                  className={
                    index < completedMoves ? 'done' : index === completedMoves ? 'current' : ''
                  }
                  key={`${move}-${index}`}
                >
                  {move}
                </span>
              ))}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
