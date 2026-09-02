import { useState } from 'react';
import type { CubeMove } from '../../hardware/smartcube/types';
import { notationExplanation } from './cubeNotation';

interface CaptureResult {
  expected: string;
  moves: CubeMove[];
}

interface GoCubeMoveCaptureProps {
  connected: boolean;
  history: CubeMove[];
  onClear: () => void;
}

const CALIBRATION_KEY = 'peterlingo:gocube-move-calibration:v1';

function rawSequence(moves: CubeMove[]): string {
  return moves.map((move) => move.notation).join(' + ');
}

function loadResults(): CaptureResult[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CALIBRATION_KEY) ?? '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (result): result is CaptureResult =>
        typeof result === 'object' &&
        result !== null &&
        typeof (result as CaptureResult).expected === 'string' &&
        Array.isArray((result as CaptureResult).moves) &&
        (result as CaptureResult).moves.every(
          (move) =>
            typeof move?.notation === 'string' &&
            typeof move.timestamp === 'number' &&
            (move.source === 'bluetooth' || move.source === 'mock')
        )
    );
  } catch {
    return [];
  }
}

function saveResults(results: CaptureResult[]): void {
  try {
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(results));
  } catch {
    // Calibration remains usable for the current page if local storage is unavailable.
  }
}

const instructions = [
  {
    notation: 'R',
    detail:
      'Behold den hvide GO-side mod dig med logoet opret. Drej laget på din højre hånd 90° med uret, når du ser direkte på højre side. Vi måler, hvilken rå kode GoCube sender.',
  },
  {
    notation: "R'",
    detail:
      'Behold samme greb. Drej laget på din højre hånd 90° mod uret, når du ser direkte på højre side.',
  },
  {
    notation: 'L',
    detail:
      'Behold samme greb. Drej laget på din venstre hånd 90° med uret, når du ser direkte på venstre side.',
  },
  {
    notation: "L'",
    detail:
      'Behold samme greb. Drej laget på din venstre hånd 90° mod uret, når du ser direkte på venstre side.',
  },
  {
    notation: 'M',
    detail:
      'Behold samme greb. Drej kun det lodrette midterlag mellem venstre og højre side i samme retning som L.',
  },
  {
    notation: "M'",
    detail:
      'Behold samme greb. Drej kun det lodrette midterlag mellem venstre og højre side modsat M-retningen.',
  },
] as const;

export function GoCubeMoveCapture({ connected, history, onClear }: GoCubeMoveCaptureProps) {
  const [results, setResults] = useState<CaptureResult[]>(() => loadResults());
  const [step, setStep] = useState(() => {
    const saved = loadResults();
    const firstMissing = instructions.findIndex(
      (instruction) => !saved.some((result) => result.expected === instruction.notation)
    );
    return firstMissing < 0 ? instructions.length : firstMissing;
  });
  const [capturing, setCapturing] = useState(false);
  const instruction = instructions[step];
  const currentRawSequence = rawSequence(history);

  const startCapture = () => {
    onClear();
    setCapturing(true);
  };

  const saveCapture = () => {
    if (!instruction || history.length === 0) return;
    setResults((current) => {
      const next = [
        ...current.filter((result) => result.expected !== instruction.notation),
        { expected: instruction.notation, moves: [...history] },
      ];
      saveResults(next);
      return next;
    });
    setCapturing(false);
    setStep((current) => current + 1);
  };

  const restart = () => {
    onClear();
    setStep(0);
    setCapturing(false);
    setResults([]);
    try {
      localStorage.removeItem(CALIBRATION_KEY);
    } catch {
      // The visible reset still works for this page.
    }
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
        Venstre side er det træk, du udfører i GO-grebet. Højre side er GoCubens rå kode. De to
        bogstaver må gerne være forskellige: hvis du udfører R og GoCube skriver B, har vi netop
        fundet oversættelsen R → B. Vi måler yderlagene først og derefter M/M′.
      </p>

      {instruction ? (
        <div className={`capture-instruction ${capturing ? 'active' : ''}`}>
          <span>
            Træk {step + 1} af {instructions.length}
          </span>
          <strong>{instruction.notation}</strong>
          <small className="capture-notation-meaning">
            {instruction.notation[0]} = {notationExplanation(instruction.notation)}
          </small>
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
                <span>Dit håndtræk: {instruction.notation}</span>
                <span>
                  GoCube skriver: <b>{history.length ? currentRawSequence : 'venter …'}</b>
                </span>
                {history.length > 0 && (
                  <strong>
                    Fundet oversættelse: {instruction.notation} → {currentRawSequence}
                  </strong>
                )}
              </p>
              <button
                type="button"
                className="button primary"
                onClick={saveCapture}
                disabled={history.length === 0}
              >
                {history.length
                  ? `Gem oversættelsen ${instruction.notation} → ${currentRawSequence} og fortsæt`
                  : 'Gem oversættelsen og fortsæt'}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="capture-complete">
          <strong>Oversættelsestabellen er gemt på denne enhed.</strong>
          <p>
            Resultaterne nedenfor viser forskellen mellem dine håndtræk og GoCubens rå koder. M/M′
            skal stadig vurderes særskilt, fordi de kan bestå af to rå hændelser.
          </p>
          <button type="button" className="button secondary" onClick={restart}>
            Start målerækken forfra
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="capture-results" aria-label="Gemt oversættelse mellem håndtræk og GoCube">
          {results.map((result) => (
            <div key={result.expected}>
              <strong>
                {result.expected} → {rawSequence(result.moves)}
              </strong>
              <span>
                Dit håndtræk: {result.expected} · rå GoCube-kode:{' '}
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
