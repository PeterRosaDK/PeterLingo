import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import { describeMove, solveFacelets, validateFacelets, type CubeSolution } from './faceletSolver';

const COLORS = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
type FaceColor = (typeof COLORS)[number];

const COLOR_NAMES: Record<FaceColor, string> = {
  U: 'hvid',
  R: 'rød',
  F: 'grøn',
  D: 'gul',
  L: 'orange',
  B: 'blå',
};

const POSITION_NAMES = [
  'øverst til venstre',
  'øverst i midten',
  'øverst til højre',
  'midt til venstre',
  'i centrum',
  'midt til højre',
  'nederst til venstre',
  'nederst i midten',
  'nederst til højre',
] as const;

const FACES = [
  { code: 'U', center: 'Hvid', top: 'blå side opad' },
  { code: 'R', center: 'Rød', top: 'hvid side opad' },
  { code: 'F', center: 'Grøn', top: 'hvid side opad' },
  { code: 'D', center: 'Gul', top: 'grøn side opad' },
  { code: 'L', center: 'Orange', top: 'hvid side opad' },
  { code: 'B', center: 'Blå', top: 'hvid side opad' },
] as const;

const SAVED_CUBE_KEY = 'peterlingo:active-manual-cube:v1';

interface SavedCubeState {
  facelets: string;
  savedAt: string;
}

function isFacelets(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length === 54 &&
    [...value].every((color) => COLORS.includes(color as FaceColor))
  );
}

function loadSavedCube(): SavedCubeState | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_CUBE_KEY) ?? 'null') as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      isFacelets((parsed as SavedCubeState).facelets) &&
      typeof (parsed as SavedCubeState).savedAt === 'string'
    ) {
      return parsed as SavedCubeState;
    }
  } catch {
    // A corrupt local draft must never block manual recovery.
  }
  return null;
}

export function colorCounts(facelets: string): Record<FaceColor, number> {
  const counts = Object.fromEntries(COLORS.map((color) => [color, 0])) as Record<FaceColor, number>;
  for (const color of facelets) {
    if (COLORS.includes(color as FaceColor)) counts[color as FaceColor] += 1;
  }
  return counts;
}

export function withCanonicalCenters(facelets: string): string {
  const stickers = [...facelets];
  COLORS.forEach((color, faceIndex) => {
    stickers[faceIndex * 9 + 4] = color;
  });
  return stickers.join('');
}

export function ManualCubeStatePage() {
  const location = useLocation();
  const supplied = (location.state as { facelets?: unknown } | null)?.facelets;
  const reported = isFacelets(supplied) ? supplied : null;
  const linkedFacelets = new URLSearchParams(location.search).get('facelets');
  const imported = isFacelets(linkedFacelets) ? linkedFacelets : null;
  const [savedCube, setSavedCube] = useState<SavedCubeState | null>(() => loadSavedCube());
  const startingState = withCanonicalCenters(
    imported ?? reported ?? savedCube?.facelets ?? SOLVED_FACELETS
  );
  const [facelets, setFacelets] = useState(startingState);
  const [copyStatus, setCopyStatus] = useState('');
  const [solveStatus, setSolveStatus] = useState<'idle' | 'working' | 'ready' | 'error'>('idle');
  const [solveMessage, setSolveMessage] = useState('');
  const [solution, setSolution] = useState<CubeSolution | null>(null);
  const [completedMoves, setCompletedMoves] = useState(0);
  const currentMove = solution?.moves[completedMoves] ?? '';
  const currentFace = COLORS.includes(currentMove[0] as FaceColor)
    ? (currentMove[0] as FaceColor)
    : 'U';
  const currentTurnSymbol = currentMove.endsWith('2')
    ? '↻↻'
    : currentMove.endsWith("'")
      ? '↺'
      : '↻';
  const counts = useMemo(() => colorCounts(facelets), [facelets]);
  const countIsCorrect = COLORS.every((color) => counts[color] === 9);
  const differences = reported
    ? [...facelets].filter((color, index) => color !== reported[index]).length
    : null;
  const differenceLabels = reported
    ? [...facelets]
        .map((color, index) =>
          color === reported[index]
            ? null
            : `${FACES[Math.floor(index / 9)]?.center.toLowerCase()} side · ${POSITION_NAMES[index % 9]}`
        )
        .filter((label): label is string => label !== null)
    : [];

  const cycleSticker = (index: number) => {
    if (index % 9 === 4 || solveStatus === 'working') return;
    const current = facelets[index] as FaceColor;
    const next = COLORS[(COLORS.indexOf(current) + 1) % COLORS.length];
    setFacelets(`${facelets.slice(0, index)}${next}${facelets.slice(index + 1)}`);
    setCopyStatus('');
    setSolveStatus('idle');
    setSolution(null);
    setCompletedMoves(0);
  };

  const replaceFacelets = (nextFacelets: string) => {
    setFacelets(withCanonicalCenters(nextFacelets));
    setCopyStatus('');
    setSolveStatus('idle');
    setSolveMessage('');
    setSolution(null);
    setCompletedMoves(0);
  };

  const saveAndSolve = async () => {
    const validation = validateFacelets(facelets);
    if (!validation.ok) {
      setSolveStatus('error');
      setSolveMessage(validation.message);
      return;
    }
    const saved = { facelets, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(SAVED_CUBE_KEY, JSON.stringify(saved));
    } catch {
      setSolveStatus('error');
      setSolveMessage('Browseren kunne ikke gemme cubens tilstand på denne enhed.');
      return;
    }
    setSavedCube(saved);
    setSolveStatus('working');
    setSolveMessage('Kontrollerer stillingen og beregner en redningsløsning …');
    setSolution(null);
    setCompletedMoves(0);
    try {
      const nextSolution = await solveFacelets(facelets);
      setSolution(nextSolution);
      setSolveStatus('ready');
      setSolveMessage(
        nextSolution.moves.length
          ? `Stillingen er fysisk mulig. Løsningen er kontrolleret og bruger ${nextSolution.moves.length} træk.`
          : 'Stillingen er allerede løst.'
      );
    } catch (error) {
      setSolveStatus('error');
      setSolveMessage(error instanceof Error ? error.message : 'Løsningen kunne ikke beregnes.');
    }
  };

  const copyFacelets = async () => {
    const report = reported
      ? [
          `GoCube: ${reported}`,
          `Fysisk: ${facelets}`,
          `Afvigelser (${differenceLabels.length}): ${differenceLabels.join(', ') || 'ingen'}`,
        ].join('\n')
      : `Fysisk: ${facelets}`;
    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus('Rapporten er kopieret. Du kan indsætte den direkte i din besked.');
    } catch {
      setCopyStatus('Kopiering blev afvist. Markér den viste tekst manuelt.');
    }
  };

  return (
    <div className="page manual-cube-page">
      <header className="page-heading">
        <p className="eyebrow">Roux · diagnostisk reservevej</p>
        <h1>Fortæl hvordan cuben faktisk ser ud</h1>
        <p>
          Du skal kun tænke på farver—ikke på bogstaver som U, R og F. Klik på et felt for at skifte
          farve. Centrene kan ikke ændres.
        </p>
      </header>

      <div className="manual-state-warning">
        Brug kun dette som kontrol. En korrekt automatisk aflæsning er stadig et krav, før live
        solving og Roux-træning aktiveres.
      </div>

      <section className="manual-entry-card" aria-labelledby="manual-entry-title">
        <div className="stage-heading">
          <div>
            <p className="eyebrow">Seks sider · ni felter</p>
            <h2 id="manual-entry-title">Indtast én side ad gangen</h2>
          </div>
          <span className={`status-pill ${countIsCorrect ? 'good' : ''}`}>
            {countIsCorrect ? '9 af hver farve' : 'Farveantal stemmer ikke endnu'}
          </span>
        </div>
        <ol className="manual-entry-steps">
          <li>Find siden med den centerfarve, der står over det lille gitter.</li>
          <li>Hold den side direkte mod dig.</li>
          <li>Drej hele cuben, så den nævnte naboside vender opad.</li>
          <li>Kopiér de ni farver præcis, som du ser dem. Klik igen for næste farve.</li>
        </ol>
        <div className="manual-face-grid">
          {FACES.map((face, faceIndex) => (
            <article key={face.code}>
              <header>
                <strong>{face.center} center mod dig</strong>
                <span>Vend så {face.top}</span>
              </header>
              <div className="manual-face" aria-label={`${face.center} side`}>
                {Array.from({ length: 9 }, (_, stickerIndex) => {
                  const index = faceIndex * 9 + stickerIndex;
                  const color = facelets[index] as FaceColor;
                  const isCenter = stickerIndex === 4;
                  const position = POSITION_NAMES[stickerIndex];
                  return (
                    <button
                      type="button"
                      className={`color-${color} ${isCenter ? 'center' : ''}`}
                      aria-label={`${face.center} side, ${position}: ${COLOR_NAMES[color]}${isCenter ? ', fast center' : ''}`}
                      disabled={isCenter || solveStatus === 'working'}
                      onClick={() => cycleSticker(index)}
                      key={index}
                    >
                      {isCenter ? <span aria-hidden="true">●</span> : ''}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="manual-state-summary" aria-labelledby="manual-summary-title">
        <div>
          <p className="eyebrow">Kontrol</p>
          <h2 id="manual-summary-title">Manuel tilstand</h2>
          <p>
            {differences === null
              ? 'Siden blev åbnet uden en GoCube-aflæsning at sammenligne med.'
              : differences === 0
                ? 'Den manuelle tilstand er endnu identisk med GoCubens aflæsning.'
                : `${differences} ${differences === 1 ? 'felt afviger' : 'felter afviger'} fra GoCubens aflæsning.`}
          </p>
          {differenceLabels.length > 0 && (
            <p className="difference-labels">Afvigende positioner: {differenceLabels.join(', ')}</p>
          )}
        </div>
        <div className="color-counts" aria-label="Antal felter per farve">
          {COLORS.map((color) => (
            <span className={counts[color] === 9 ? 'good' : ''} key={color}>
              <i className={`color-${color}`} />
              {COLOR_NAMES[color]}: <b>{counts[color]}</b>/9
            </span>
          ))}
        </div>
        <details className="technical-facelets">
          <summary>Vis teknisk kode til fejlsøgning</summary>
          <p>
            Her bruger softwaren bogstaver som farvekoder: U er hvid, R er rød, F er grøn, D er gul,
            L er orange, og B er blå. Du behøver ikke bruge eller forstå dem for at tegne cuben.
          </p>
          <label className="facelet-output">
            Teknisk 54-tegnskode
            <textarea value={facelets} readOnly rows={3} />
          </label>
        </details>
        <div className="button-row">
          <button
            type="button"
            className="button primary"
            onClick={() => void saveAndSolve()}
            disabled={solveStatus === 'working'}
          >
            {solveStatus === 'working' ? 'Beregner løsning …' : 'Gem og lav løsning'}
          </button>
          <button type="button" className="button secondary" onClick={() => void copyFacelets()}>
            {reported ? 'Kopiér sammenligningen' : 'Kopiér tilstanden'}
          </button>
          {reported && facelets !== reported && (
            <button
              type="button"
              className="button secondary"
              onClick={() => replaceFacelets(reported)}
            >
              Gendan GoCubens forslag
            </button>
          )}
          {savedCube && facelets !== savedCube.facelets && (
            <button
              type="button"
              className="button secondary"
              onClick={() => replaceFacelets(savedCube.facelets)}
            >
              Gendan senest gemte tilstand
            </button>
          )}
        </div>
        <p className="local-cube-save-note">
          Gemmes kun på denne enhed. Cubens øjeblikstilstand hører ikke til din cloudbaserede
          læringshistorik.
          {savedCube ? ` Senest gemt ${new Date(savedCube.savedAt).toLocaleString('da-DK')}.` : ''}
        </p>
        {copyStatus && <p role="status">{copyStatus}</p>}
        {solveMessage && (
          <p className={`solve-message ${solveStatus}`} role="status">
            {solveMessage}
          </p>
        )}
      </section>

      {solution && (
        <section className="cube-rescue-solution" aria-labelledby="rescue-solution-title">
          <div className="stage-heading">
            <div>
              <p className="eyebrow">Løs for mig · sikker redningsvej</p>
              <h2 id="rescue-solution-title">Trin for trin tilbage til løst</h2>
            </div>
            <span className="status-pill">
              {completedMoves}/{solution.moves.length} træk
            </span>
          </div>
          <p className="recovery-method-note">
            Dette er en verificeret to-fase-løsning. Den er beregnet til at redde den aktuelle cube;
            den er ikke den planlagte Roux-undervisning.
          </p>
          <p className="recovery-grip-note">
            <strong>Sådan holder du cuben:</strong> Farven i hvert trin skal vende direkte mod dig.
            Det er ligegyldigt, hvilken af de fire nabofarver der vender opad. “Med uret” og “mod
            uret” skal altid aflæses, som du ser den farvede side forfra.
          </p>

          {completedMoves < solution.moves.length ? (
            <div className="current-solve-step">
              <div className={`solve-face color-${currentFace}`} aria-hidden="true">
                {currentTurnSymbol}
              </div>
              <div>
                <p className="eyebrow">
                  Træk {completedMoves + 1} af {solution.moves.length}
                </p>
                <strong>{COLOR_NAMES[currentFace]} side</strong>
                <p>{describeMove(currentMove)}</p>
                <small>Teknisk navn: {currentMove}</small>
              </div>
            </div>
          ) : (
            <div className="cube-solved-message">
              <strong>Cuben bør nu være løst</strong>
              <p>Sammenlign alle seks fysiske sider. Gå ét trin tilbage, hvis noget ikke passer.</p>
            </div>
          )}

          <div className="solve-progress" aria-label="Løsningsfremskridt">
            <span
              style={{ width: `${(completedMoves / Math.max(solution.moves.length, 1)) * 100}%` }}
            />
          </div>
          <div className="button-row">
            <button
              type="button"
              className="button secondary"
              onClick={() => setCompletedMoves((current) => Math.max(0, current - 1))}
              disabled={completedMoves === 0}
            >
              Forrige træk
            </button>
            {completedMoves < solution.moves.length && (
              <button
                type="button"
                className="button primary"
                onClick={() =>
                  setCompletedMoves((current) => Math.min(solution.moves.length, current + 1))
                }
              >
                Jeg har lavet trækket
              </button>
            )}
            {completedMoves === solution.moves.length && solution.moves.length > 0 && (
              <button
                type="button"
                className="button secondary"
                onClick={() => setCompletedMoves(0)}
              >
                Vis løsningen fra begyndelsen
              </button>
            )}
          </div>
          <details className="technical-facelets">
            <summary>Vis hele den tekniske trækrække</summary>
            <p className="solution-algorithm">{solution.algorithm || 'Ingen træk nødvendige'}</p>
          </details>
        </section>
      )}

      <div className="button-row manual-state-actions">
        <Link className="button secondary" to="/fag/roux/diagnostik">
          Tilbage til diagnostikken
        </Link>
        <Link className="button secondary" to="/fag/roux/notation">
          Se notationshjælpen
        </Link>
      </div>
    </div>
  );
}
