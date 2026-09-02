import { useState } from 'react';
import type { CubeMove } from '../../hardware/smartcube/types';

interface CaptureResult {
  expected: string;
  moves: CubeMove[];
}

interface GoCubeMoveCaptureProps {
  connected: boolean;
  history: CubeMove[];
  onClear: () => void;
}

const instructions = [
  { notation: 'R', detail: 'Drej højre yderlag som et almindeligt R.' },
  { notation: "R'", detail: 'Drej højre yderlag tilbage som R′.' },
  { notation: 'L', detail: 'Drej venstre yderlag som et almindeligt L.' },
  { notation: "L'", detail: 'Drej venstre yderlag tilbage som L′.' },
  {
    notation: 'M',
    detail: 'Drej kun det lodrette midterlag i samme retning som et L-træk.',
  },
  {
    notation: "M'",
    detail: 'Drej kun det lodrette midterlag modsat M-retningen.',
  },
] as const;

export function GoCubeMoveCapture({ connected, history, onClear }: GoCubeMoveCaptureProps) {
  const [step, setStep] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [results, setResults] = useState<CaptureResult[]>([]);
  const instruction = instructions[step];

  const startCapture = () => {
    onClear();
    setCapturing(true);
  };

  const saveCapture = () => {
    if (!instruction || history.length === 0) return;
    setResults((current) => [
      ...current.filter((result) => result.expected !== instruction.notation),
      { expected: instruction.notation, moves: [...history] },
    ]);
    setCapturing(false);
    setStep((current) => current + 1);
  };

  const restart = () => {
    onClear();
    setStep(0);
    setCapturing(false);
    setResults([]);
  };

  return (
    <section className="move-capture" aria-labelledby="move-capture-title">
      <div className="stage-heading">
        <div>
          <p className="eyebrow">Guidet protokol</p>
          <h2 id="move-capture-title">Sådan taler GoCube</h2>
        </div>
        <span className={`status-pill ${connected ? 'good' : ''}`}>
          {connected ? 'Klar til måling' : 'Forbind cuben først'}
        </span>
      </div>
      <p>
        Vi måler yderlagene først og derefter M/M′. Du starter og gemmer hver måling manuelt, så
        appen ikke gætter på, om GoCube sender én eller to rå hændelser.
      </p>

      {instruction ? (
        <div className={`capture-instruction ${capturing ? 'active' : ''}`}>
          <span>
            Træk {step + 1} af {instructions.length}
          </span>
          <strong>{instruction.notation}</strong>
          <p>{instruction.detail}</p>
          {!capturing ? (
            <button
              type="button"
              className="button primary"
              onClick={startCapture}
              disabled={!connected}
            >
              Start måling af {instruction.notation}
            </button>
          ) : (
            <>
              <p className="capture-now" role="status">
                Udfør nu {instruction.notation} præcis én gang. Rå registrering:{' '}
                <b>
                  {history.length ? history.map((move) => move.notation).join(' · ') : 'venter …'}
                </b>
              </p>
              <button
                type="button"
                className="button primary"
                onClick={saveCapture}
                disabled={history.length === 0}
              >
                Gem måling og fortsæt
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="capture-complete">
          <strong>Målerækken er færdig.</strong>
          <p>Resultaterne nedenfor kan bruges til at fastlægge M/M′-normaliseringen.</p>
          <button type="button" className="button secondary" onClick={restart}>
            Start målerækken forfra
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="capture-results" aria-label="Gemte rå GoCube-målinger">
          {results.map((result) => (
            <div key={result.expected}>
              <strong>Du udførte {result.expected}</strong>
              <span>
                GoCube sendte{' '}
                {result.moves
                  .map((move, index) => {
                    const previous = result.moves[index - 1];
                    const delta = previous
                      ? Math.max(0, Math.round(move.timestamp - previous.timestamp))
                      : null;
                    return `${move.notation}${delta === null ? '' : ` (+${delta} ms)`}`;
                  })
                  .join(' · ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
