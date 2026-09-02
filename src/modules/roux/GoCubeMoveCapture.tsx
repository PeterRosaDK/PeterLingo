import { useState } from 'react';
import type { CubeMove } from '../../hardware/smartcube/types';
import { notationExplanation } from './cubeNotation';

export interface CaptureResult {
  expected: string;
  moves: CubeMove[];
}

interface GoCubeMoveCaptureProps {
  connected: boolean;
  history: CubeMove[];
  onClear: () => void;
}

const CALIBRATION_KEY = 'peterlingo:gocube-move-calibration:v2';

function rawSequence(moves: CubeMove[]): string {
  return moves.map((move) => move.notation).join(' + ');
}

function timedSequence(moves: CubeMove[]): string {
  return moves
    .map((move, index) => {
      const previous = moves[index - 1];
      const delta = previous ? Math.max(0, Math.round(move.timestamp - previous.timestamp)) : null;
      return `${move.notation}${delta === null ? '' : ` (+${delta} ms)`}`;
    })
    .join(' · ');
}

export function formatGoCubeCalibrationReport(results: CaptureResult[]): string {
  const byExpected = new Map(results.map((result) => [result.expected, result]));
  return [
    'GoCube-målerapport v2',
    'Reference: hvid/GO op · grøn mod brugeren',
    ...instructions.flatMap((instruction) => {
      const result = byExpected.get(instruction.notation);
      return result
        ? [
            `${instruction.notation} → ${rawSequence(result.moves)} | ${timedSequence(result.moves)}`,
          ]
        : [];
    }),
  ].join('\n');
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
      'Hold hvid/GO opad og grøn mod dig. Det røde lag er nu til højre. Drej det 90° med uret, når du ser direkte på den røde side.',
  },
  {
    notation: "R'",
    detail:
      'Behold hvid/GO opad og grøn mod dig. Drej det røde lag til højre 90° mod uret, når du ser direkte på den røde side.',
  },
  {
    notation: 'L',
    detail:
      'Behold hvid/GO opad og grøn mod dig. Det orange lag er til venstre. Drej det 90° med uret, når du ser direkte på den orange side.',
  },
  {
    notation: "L'",
    detail:
      'Behold hvid/GO opad og grøn mod dig. Drej det orange lag til venstre 90° mod uret, når du ser direkte på den orange side.',
  },
  {
    notation: 'M',
    detail:
      'Behold hvid/GO opad og grøn mod dig. Flyt den grønne midterkolonne nedad. Brug gerne pegefingeren og lav ét rent kvartdrej.',
  },
  {
    notation: "M'",
    detail:
      'Behold hvid/GO opad og grøn mod dig. Flyt den grønne midterkolonne opad. Brug den fingerteknik, der føles naturlig.',
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
  const [copyStatus, setCopyStatus] = useState('');
  const instruction = instructions[step];
  const currentRawSequence = rawSequence(history);
  const isOuterTurn = step < 4;
  const outerTurnMatches =
    !isOuterTurn || (history.length === 1 && history[0]?.notation === instruction?.notation);
  const hasMismatchedOuterTurn =
    Boolean(instruction) && capturing && history.length > 0 && !outerTurnMatches;
  const canSaveCapture = history.length > 0 && outerTurnMatches;

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

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(formatGoCubeCalibrationReport(results));
      setCopyStatus('Målerapporten er kopieret. Indsæt den direkte i din næste besked.');
    } catch {
      setCopyStatus('Kopiering blev afvist. Resultaterne nedenfor kan kopieres manuelt.');
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
        Brug standardgrebet: hvid/GO opad og grøn mod dig. Så skal et almindeligt ydertræk have
        samme bogstav hos dig og GoCube. Hvis R bliver til B, vender cuben forkert. M/M′ måles
        bagefter, fordi GoCube kan sende dem som to rå ydertræk.
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
                {history.length > 0 && outerTurnMatches && isOuterTurn && (
                  <strong>
                    Bekræftet: {instruction.notation} → {currentRawSequence}
                  </strong>
                )}
                {history.length > 0 && !isOuterTurn && (
                  <strong>
                    M-måling: {instruction.notation} → {currentRawSequence}
                  </strong>
                )}
                {hasMismatchedOuterTurn && (
                  <strong className="capture-mismatch">
                    Stop: {instruction.notation} → {currentRawSequence} betyder, at referencegrebet
                    ikke passer. Læg hvid/GO opad og vend grøn mod dig.
                  </strong>
                )}
              </p>
              {hasMismatchedOuterTurn ? (
                <button type="button" className="button secondary" onClick={onClear}>
                  Ryd og prøv {instruction.notation} igen
                </button>
              ) : (
                <button
                  type="button"
                  className="button primary"
                  onClick={saveCapture}
                  disabled={!canSaveCapture}
                >
                  {history.length
                    ? `Gem målingen ${instruction.notation} → ${currentRawSequence} og fortsæt`
                    : 'Gem målingen og fortsæt'}
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="capture-complete">
          <strong>Målerækken er gemt på denne enhed.</strong>
          <p>
            Ydertrækkene bekræfter standardgrebet. M/M′ skal stadig vurderes særskilt, fordi de kan
            bestå af to rå hændelser. Målingen er lokal og skal kopieres, før den kan bruges i
            PeterLingos normalisering.
          </p>
          <div className="button-row">
            <button type="button" className="button primary" onClick={() => void copyReport()}>
              Kopiér målerapport
            </button>
            <button type="button" className="button secondary" onClick={restart}>
              Start målerækken forfra
            </button>
          </div>
          {copyStatus && <p role="status">{copyStatus}</p>}
        </div>
      )}

      {results.length > 0 && (
        <div className="capture-results" aria-label="Gemte GoCube-målinger">
          {results.map((result) => (
            <div key={result.expected}>
              <strong>
                {result.expected} → {rawSequence(result.moves)}
              </strong>
              <span>
                Dit håndtræk: {result.expected} · rå GoCube-kode: {timedSequence(result.moves)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
