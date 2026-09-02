import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';

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

function isFacelets(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length === 54 &&
    [...value].every((color) => COLORS.includes(color as FaceColor))
  );
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
  const startingState = withCanonicalCenters(reported ?? SOLVED_FACELETS);
  const [facelets, setFacelets] = useState(startingState);
  const [copyStatus, setCopyStatus] = useState('');
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
    if (index % 9 === 4) return;
    const current = facelets[index] as FaceColor;
    const next = COLORS[(COLORS.indexOf(current) + 1) % COLORS.length];
    setFacelets(`${facelets.slice(0, index)}${next}${facelets.slice(index + 1)}`);
    setCopyStatus('');
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
                      disabled={isCenter}
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
          <button type="button" className="button primary" onClick={() => void copyFacelets()}>
            {reported ? 'Kopiér sammenligningen' : 'Kopiér tilstanden'}
          </button>
          {reported && facelets !== reported && (
            <button
              type="button"
              className="button secondary"
              onClick={() => setFacelets(reported)}
            >
              Gendan GoCubens forslag
            </button>
          )}
        </div>
        {copyStatus && <p role="status">{copyStatus}</p>}
      </section>

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
