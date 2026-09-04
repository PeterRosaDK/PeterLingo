import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { physicalCubeAdapter } from '../../hardware/smartcube/physicalCube';
import {
  fixedLeftFirstBlockProgress,
  type FixedFirstBlockPieceId,
} from '../../hardware/smartcube/state';
import type { ConnectionState, CubeState, SmartCubeAdapter } from '../../hardware/smartcube/types';
import type { GeneratedExercise } from '../../learning/types';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';

const introExercise: GeneratedExercise<{ block: string; movablePieces: number }> = {
  id: 'roux:first-block-intro:left-down:v1',
  learningUnitId: 'roux:first-block-intro',
  discipline: 'roux',
  prompt: 'Forstå First Block som to små delmål',
  parameters: { block: 'fixed-left-down', movablePieces: 5 },
  hints: [],
};

const lessonSteps = [
  {
    eyebrow: '1 · Se målet',
    title: 'Byg en orange-gul 1×2×3-blok nederst til venstre',
    body: 'First Block er ikke en hel side. Blokken indeholder det orange venstre center og hviler langs den gule bundside; det gule center er ikke selv en del af blokken. Resten af cuben må gerne være blandet.',
    note: 'Vi begynder kun med venstre blok. Farveneutralitet kan komme senere.',
  },
  {
    eyebrow: '2 · Find fem brikker',
    title: 'Du leder efter to hjørner og tre kanter',
    body: 'Farverne fortæller, hvilke brikker der hører til blokken. Centrene flytter sig ikke og fungerer som adresseskilte.',
    note: 'Ignorér alle brikker uden orange. De kan ikke høre til denne første blok.',
  },
  {
    eyebrow: '3 · Lav den forreste firkant',
    title: 'Saml først tre brikker som en 1×2×2-firkant',
    body: 'Arbejd med gul-orange-grøn-hjørnet, grøn-orange-kanten og gul-orange-kanten. Prøv at samle et hjørne og en kant som et par, før du sætter dem ved centrene.',
    note: 'Hvis et træk ødelægger dit lille par, så før parret væk, gør plads og sæt det tilbage.',
  },
  {
    eyebrow: '4 · Udvid bagud',
    title: 'Sæt det blå-orange par på den færdige firkant',
    body: 'Find gul-orange-blå-hjørnet og blå-orange-kanten. Saml dem som et par og indsæt dem bag den første firkant. Nu er hele 1×2×3-blokken færdig.',
    note: 'Målet er forståelse, ikke fart. Brug så mange ydertræk, som du har brug for.',
  },
] as const;

const pieceLabels: Array<{
  id: FixedFirstBlockPieceId;
  colors: string;
  label: string;
  group: 'Forreste firkant' | 'Bageste par';
}> = [
  {
    id: 'front-corner',
    colors: 'gul · orange · grøn',
    label: 'forreste hjørne',
    group: 'Forreste firkant',
  },
  {
    id: 'front-edge',
    colors: 'grøn · orange',
    label: 'forreste kant',
    group: 'Forreste firkant',
  },
  {
    id: 'bottom-edge',
    colors: 'gul · orange',
    label: 'bundkant',
    group: 'Forreste firkant',
  },
  {
    id: 'back-corner',
    colors: 'gul · orange · blå',
    label: 'bageste hjørne',
    group: 'Bageste par',
  },
  {
    id: 'back-edge',
    colors: 'blå · orange',
    label: 'bageste kant',
    group: 'Bageste par',
  },
];

function FirstBlockTarget() {
  return (
    <div className="first-block-target" aria-label="First Block omkring orange og gul">
      <div className="first-block-cube" aria-hidden="true">
        <div className="block-face block-orange">
          {Array.from({ length: 6 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <div className="block-face block-yellow">
          {Array.from({ length: 3 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <div className="block-face block-side">
          {Array.from({ length: 2 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      </div>
      <div>
        <span>Dit første faste mål</span>
        <strong>Orange til venstre · gul i bunden</strong>
        <p>En 1×2×3-blok, der kan løftes som én samlet klods.</p>
      </div>
    </div>
  );
}

function FirstBlockLesson({ onFinish }: { onFinish(): void }) {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const { record } = useAttemptRecorder(introExercise);
  const lesson = lessonSteps[step]!;

  const finish = async () => {
    await record({
      correct: true,
      hintsUsed: 0,
      answerRevealed: false,
      stage: 'teaching',
      fluentThresholdMs: 120_000,
    });
    setComplete(true);
    onFinish();
  };

  return (
    <section className="lesson-card first-block-lesson" aria-labelledby="first-block-lesson-title">
      <header>
        <div>
          <p className="eyebrow">{lesson.eyebrow}</p>
          <h2 id="first-block-lesson-title">{lesson.title}</h2>
          <p>{lesson.body}</p>
        </div>
        <span className="ear-step-count">{step + 1}/4</span>
      </header>

      {step === 0 && <FirstBlockTarget />}
      {step === 1 && (
        <div className="first-block-piece-list">
          {pieceLabels.map((piece) => (
            <div key={piece.id}>
              <span>{piece.colors}</span>
              <strong>{piece.label}</strong>
              <small>{piece.group}</small>
            </div>
          ))}
        </div>
      )}
      {step === 2 && (
        <div className="block-recipe front-square-recipe">
          <span>gul-orange-grøn</span>
          <b>+</b>
          <span>grøn-orange</span>
          <b>+</b>
          <span>gul-orange</span>
          <strong>= forreste firkant</strong>
        </div>
      )}
      {step === 3 && (
        <div className="block-recipe full-block-recipe">
          <span>forreste firkant</span>
          <b>+</b>
          <span>gul-orange-blå</span>
          <b>+</b>
          <span>blå-orange</span>
          <strong>= First Block</strong>
        </div>
      )}

      <p className="first-block-note">{lesson.note}</p>
      <div className="ear-lesson-nav">
        <button
          className="button secondary"
          type="button"
          disabled={step === 0}
          onClick={() => setStep((current) => current - 1)}
        >
          Forrige
        </button>
        {step < lessonSteps.length - 1 ? (
          <button
            className="button primary"
            type="button"
            onClick={() => setStep((current) => current + 1)}
          >
            Næste delmål
          </button>
        ) : complete ? (
          <span className="status-pill good">Introduktion gennemført</span>
        ) : (
          <button className="button primary" type="button" onClick={() => void finish()}>
            Jeg er klar til at bygge blokken
          </button>
        )}
      </div>
    </section>
  );
}

function FirstBlockPractice({ adapter }: { adapter: SmartCubeAdapter }) {
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [cubeState, setCubeState] = useState<CubeState | null>(() => adapter.getCubeState());
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [mode, setMode] = useState<'idle' | 'live' | 'manual' | 'complete'>('idle');
  const [completionMessage, setCompletionMessage] = useState('');
  const completionLocked = useRef(false);
  const exercise = useMemo<GeneratedExercise<{ mode: string; block: string }>>(
    () => ({
      id: `roux:first-block-practice:${attemptNumber}`,
      learningUnitId: 'roux:first-block-live',
      discipline: 'roux',
      prompt: 'Byg den faste venstre First Block',
      parameters: { mode: 'pending', block: 'fixed-left-down' },
      hints: [
        {
          id: 'front-square',
          label: 'Begynd med firkanten',
          content: 'Saml de tre forreste målbrikker først.',
        },
        {
          id: 'back-pair',
          label: 'Afslut med parret',
          content: 'Saml blå-orange-kanten med gul-orange-blå-hjørnet.',
        },
      ],
    }),
    [attemptNumber]
  );
  const { record, restartTimer } = useAttemptRecorder(exercise);
  const progress = fixedLeftFirstBlockProgress(cubeState?.facelets ?? '');
  const isLiveReady =
    connection === 'connected' && cubeState?.synchronization === 'synchronized' && progress.valid;

  const finishAttempt = useCallback(
    async (verifiedByCube: boolean) => {
      if (completionLocked.current) return;
      completionLocked.current = true;
      await record({
        correct: true,
        hintsUsed: 0,
        answerRevealed: false,
        stage: verifiedByCube ? 'unassisted' : 'assisted',
        fluentThresholdMs: 180_000,
        parameterOverrides: {
          mode: verifiedByCube ? 'live-gocube' : 'self-reported',
          verifiedByCube,
        },
      });
      setCompletionMessage(
        verifiedByCube
          ? 'GoCube har genkendt alle fem målbrikker. Din First Block er færdig.'
          : 'Øvelsen er gemt som selvrapporteret træning.'
      );
      setMode('complete');
    },
    [record]
  );

  useEffect(() => {
    const inspect = (nextState: CubeState | null) => {
      setCubeState(nextState);
      setConnection(adapter.getConnectionState());
      if (mode === 'live' && fixedLeftFirstBlockProgress(nextState?.facelets ?? '').complete) {
        void finishAttempt(true);
      }
    };
    const offState = adapter.subscribeToState?.(inspect);
    const offMove = adapter.subscribeToMoves(() => inspect(adapter.getCubeState()));
    inspect(adapter.getCubeState());
    return () => {
      offState?.();
      offMove();
    };
  }, [adapter, finishAttempt, mode]);

  const start = (nextMode: 'live' | 'manual') => {
    completionLocked.current = false;
    setCompletionMessage('');
    setMode(nextMode);
    restartTimer();
  };

  const restart = () => {
    setAttemptNumber((current) => current + 1);
    completionLocked.current = false;
    setCompletionMessage('');
    setMode('idle');
    restartTimer();
  };

  return (
    <section
      className={`lesson-card first-block-practice ${mode === 'live' ? 'is-live' : ''}`}
      id="first-block-practice"
      aria-labelledby="first-block-practice-title"
    >
      <div className="stage-heading">
        <div>
          <p className="eyebrow">Etape 1 · fysisk træning</p>
          <h2 id="first-block-practice-title">Byg din første blok</h2>
        </div>
        <span className={`status-pill ${isLiveReady ? 'good' : ''}`}>
          {isLiveReady ? 'GoCube følger med' : 'Manuel træning mulig'}
        </span>
      </div>
      <p>
        Bland cuben, behold hvid op og grøn frem, og byg den orange-gule blok nederst til venstre.
        Appen viser kun delmålene — du finder selv trækkene.
      </p>
      <p className="first-block-calibration-note">
        Alle træk skrives med standardnotation. Brug kun ydertræk i denne første udgave. M og M′ er
        ikke nødvendige til First Block, og vi tager dem først med, når din kopierede
        GoCube-målerapport er fortolket.
      </p>

      <div className="first-block-live-grid">
        <div className="first-block-progress-panel">
          <div className="block-progress-heading">
            <span>Live målbrikker</span>
            <strong>{progress.valid ? progress.solvedPieceIds.length : '—'}/5</strong>
          </div>
          <div className="block-progress-bar" aria-hidden="true">
            <span style={{ width: `${progress.solvedPieceIds.length * 20}%` }} />
          </div>
          <div className="block-piece-status">
            {pieceLabels.map((piece) => {
              const solved = progress.solvedPieceIds.includes(piece.id);
              return (
                <div className={solved ? 'solved' : ''} key={piece.id}>
                  <b>{solved ? '✓' : progress.valid ? '○' : '·'}</b>
                  <span>
                    <strong>{piece.colors}</strong>
                    <small>{piece.label}</small>
                  </span>
                </div>
              );
            })}
          </div>
          <div className={`subgoal-status ${progress.frontSquareComplete ? 'complete' : ''}`}>
            <b>{progress.frontSquareComplete ? '✓' : '1'}</b>
            <span>
              <strong>Forreste firkant</strong>
              <small>
                {progress.frontSquareComplete ? 'samlet' : 'saml de første tre brikker'}
              </small>
            </span>
          </div>
          <div className={`subgoal-status ${progress.complete ? 'complete' : ''}`}>
            <b>{progress.complete ? '✓' : '2'}</b>
            <span>
              <strong>Hele First Block</strong>
              <small>{progress.complete ? 'samlet' : 'tilføj det bageste par'}</small>
            </span>
          </div>
        </div>

        <aside className="first-block-coach">
          {mode === 'complete' ? (
            <div className="roux-practice-complete" role="status">
              <span aria-hidden="true">★</span>
              <strong>First Block gennemført</strong>
              <p>{completionMessage}</p>
              <button type="button" className="button primary" onClick={restart}>
                Træn én gang til
              </button>
            </div>
          ) : mode === 'live' ? (
            <div className="live-coach-message" role="status">
              <span className="live-dot" aria-hidden="true" />
              <strong>Forsøget er i gang</strong>
              <p>
                {progress.frontSquareComplete
                  ? 'Flot. Bevar firkanten, mens du samler og indsætter det blå-orange par.'
                  : 'Find de tre brikker til den forreste firkant. GoCube markerer dem automatisk.'}
              </p>
            </div>
          ) : mode === 'manual' ? (
            <div className="live-coach-message">
              <strong>Træn uden aflæsning</strong>
              <p>
                Sammenlign din blok med farvelisten, og bekræft selv, når alle fem brikker sidder.
              </p>
              <button
                type="button"
                className="button primary"
                onClick={() => void finishAttempt(false)}
              >
                Min First Block er samlet
              </button>
            </div>
          ) : (
            <div className="first-block-start">
              {isLiveReady ? (
                progress.complete ? (
                  <p>
                    First Block er allerede samlet. Bland cuben, indtil mindst én målbrik forlader
                    blokken; knappen bliver derefter klar.
                  </p>
                ) : (
                  <button type="button" className="button primary" onClick={() => start('live')}>
                    Start med live GoCube
                  </button>
                )
              ) : (
                <>
                  <p>
                    Forbind GoCube under Opsætning for automatisk kontrol, eller øv med din egen
                    visuelle kontrol.
                  </p>
                  <Link className="button secondary" to="/fag/roux/opsaetning">
                    Forbind GoCube
                  </Link>
                </>
              )}
              <button type="button" className="button secondary" onClick={() => start('manual')}>
                Start uden GoCube
              </button>
            </div>
          )}

          <details className="first-block-hints">
            <summary>Jeg sidder fast</summary>
            <ol>
              <li>Find gul-orange-kanten; den viser blokkens nederste venstre ryg.</li>
              <li>Lav et lille par af et orange hjørne og den kant, der deler tredje farve.</li>
              <li>
                Flyt det færdige par væk, når du skal skabe plads, og sæt det tilbage bagefter.
              </li>
              <li>Brug ikke tid på at redde andre farver. Kun de fem målbrikker tæller endnu.</li>
            </ol>
          </details>
        </aside>
      </div>
    </section>
  );
}

export function RouxFirstBlockPage({
  cubeAdapter = physicalCubeAdapter,
}: {
  cubeAdapter?: SmartCubeAdapter;
}) {
  const revealPractice = () => {
    window.setTimeout(() => {
      document.getElementById('first-block-practice')?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  return (
    <div className="page roux-first-block-page">
      <header className="subject-hero ice first-block-hero">
        <div>
          <p className="eyebrow">Roux · etape 1</p>
          <h1>First Block</h1>
          <p>Se fem bestemte brikker som én blok — og byg den uden en lang algoritme.</p>
          <div className="first-block-hero-meta">
            <span>4 korte forklaringer</span>
            <span>5 målbrikker</span>
            <span>Live GoCube-kontrol</span>
          </div>
        </div>
        <FirstBlockTarget />
      </header>

      <nav className="lesson-breadcrumb" aria-label="Roux-navigation">
        <Link to="/fag/roux">Roux</Link>
        <span>→</span>
        <strong>First Block</strong>
      </nav>

      <FirstBlockLesson onFinish={revealPractice} />
      <FirstBlockPractice adapter={cubeAdapter} />

      <p className="curriculum-source">
        Metodegrundlag:{' '}
        <a
          href="https://tutorial.rouxers.com/beginners/first-block.html"
          target="_blank"
          rel="noreferrer"
        >
          Rouxers’ begyndervejledning til First Block
        </a>
        . PeterLingo fastholder vores eget hvide-op, grønne-front referencegreb.
      </p>
      <div className="button-row page-footer-actions">
        <Link className="button primary" to="/fag/roux/second-block">
          Fortsæt til Second Block
        </Link>
        <Link className="button secondary" to="/fag/roux/notation">
          Slå notation op
        </Link>
        <Link className="button secondary" to="/fag/roux/traening">
          Træningsoversigt
        </Link>
      </div>
    </div>
  );
}
