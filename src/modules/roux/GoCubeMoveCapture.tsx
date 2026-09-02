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
  {
    notation: 'R',
    detail:
      'Behold den hvide GO-side mod dig med logoet opret. Det røde center er øverst: drej det røde toplag 90° med uret, set direkte mod den røde side ovenfra.',
  },
  {
    notation: "R'",
    detail:
      'Behold samme greb. Drej det røde toplag 90° mod uret, set direkte mod den røde side ovenfra.',
  },
  {
    notation: 'L',
    detail:
      'Behold samme greb. Det orange center er nederst: drej det orange bundlag 90° med uret, set direkte mod den orange side nedefra.',
  },
  {
    notation: "L'",
    detail:
      'Behold samme greb. Drej det orange bundlag 90° mod uret, set direkte mod den orange side nedefra.',
  },
  {
    notation: 'M',
    detail:
      'Behold samme greb. Drej kun midterlaget mellem det røde top- og orange bundlag i samme retning som L.',
  },
  {
    notation: "M'",
    detail:
      'Behold samme greb. Drej kun midterlaget mellem det røde top- og orange bundlag modsat M-retningen.',
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
