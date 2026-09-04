import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TwistyPlayerConfig } from 'cubing/twisty';
import { Link } from 'react-router-dom';
import { physicalCubeAdapter } from '../../hardware/smartcube/physicalCube';
import {
  fixedLeftFirstBlockProgress,
  type FixedFirstBlockPieceId,
} from '../../hardware/smartcube/state';
import type { ConnectionState, CubeState, SmartCubeAdapter } from '../../hardware/smartcube/types';
import type { GeneratedExercise } from '../../learning/types';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import { CubeViewer } from './CubeViewer';
import { RouxPhaseCubePanel } from './RouxPhaseCubePanel';

type StickeringMask = NonNullable<TwistyPlayerConfig['experimentalStickeringMaskOrbits']>;

const introExercise: GeneratedExercise<{ block: string; subgoals: number }> = {
  id: 'roux:first-block-intro:left-down:v2',
  learningUnitId: 'roux:first-block-intro',
  discipline: 'roux',
  prompt: 'Genkend First Block i to visuelle delmål',
  parameters: { block: 'fixed-left-down', subgoals: 2 },
  hints: [],
};

const pieceLabels: Array<{
  id: FixedFirstBlockPieceId;
  shortColors: string;
  label: string;
  goal: 0 | 1;
}> = [
  {
    id: 'front-corner',
    shortColors: 'gul-orange-grøn',
    label: 'hjørne',
    goal: 0,
  },
  {
    id: 'front-edge',
    shortColors: 'grøn-orange',
    label: 'kant',
    goal: 0,
  },
  {
    id: 'bottom-edge',
    shortColors: 'gul-orange',
    label: 'kant',
    goal: 0,
  },
  {
    id: 'back-corner',
    shortColors: 'gul-orange-blå',
    label: 'hjørne',
    goal: 1,
  },
  {
    id: 'back-edge',
    shortColors: 'blå-orange',
    label: 'kant',
    goal: 1,
  },
];

const goalSteps = [
  {
    title: 'Saml den forreste firkant',
    shortTitle: 'Forreste firkant',
    instruction:
      'Saml de tre fremhævede brikker omkring det orange center. Når de passer, ser du et orange 2×2-felt på venstre side.',
    cue: 'Find hjørnet med tre farver først. Find derefter de to kanter, som deler to af hjørnets farver.',
  },
  {
    title: 'Udvid firkanten bagud',
    shortTitle: 'Hele First Block',
    instruction:
      'Bevar den forreste firkant. Saml det blå-orange par og sæt det bagved, så den orange side bliver 2×3.',
    cue: 'Kun to nye brikker mangler: det gul-orange-blå hjørne og den blå-orange kant.',
  },
] as const;

const ignoredPiece = () => ({ facelets: Array.from({ length: 5 }, () => 'ignored' as const) });
const regularPiece = () => ({ facelets: Array.from({ length: 5 }, () => 'regular' as const) });
const dimPiece = () => ({ facelets: Array.from({ length: 5 }, () => 'dim' as const) });

const frontSquareMask: StickeringMask = {
  name: 'PeterLingo Roux front square',
  orbits: {
    EDGES: {
      pieces: Array.from({ length: 12 }, (_, index) =>
        index === 7 || index === 9 ? regularPiece() : ignoredPiece()
      ),
    },
    CORNERS: {
      pieces: Array.from({ length: 8 }, (_, index) =>
        index === 5 ? regularPiece() : ignoredPiece()
      ),
    },
    CENTERS: {
      pieces: Array.from({ length: 6 }, (_, index) => {
        if (index === 1) return regularPiece();
        if (index === 2 || index === 5) return dimPiece();
        return ignoredPiece();
      }),
    },
  },
};

function FirstBlockGoalViewer({ goal }: { goal: 0 | 1 }) {
  return (
    <CubeViewer
      allowDrag={false}
      ariaLabel={`Delmål i 3D: ${goalSteps[goal].shortTitle}`}
      cameraLatitude={-18}
      cameraLongitude={goal === 1 ? -146 : -34}
      stickering={goal === 1 ? 'FirstBlock' : null}
      stickeringMask={goal === 0 ? frontSquareMask : undefined}
    />
  );
}

function FirstBlockCourse({ adapter }: { adapter: SmartCubeAdapter }) {
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [cubeState, setCubeState] = useState<CubeState | null>(() => adapter.getCubeState());
  const [selectedGoal, setSelectedGoal] = useState<0 | 1>(0);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [mode, setMode] = useState<'idle' | 'live' | 'manual' | 'complete'>('idle');
  const [completionMessage, setCompletionMessage] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [connecting, setConnecting] = useState(false);
  const completionLocked = useRef(false);
  const introRecorded = useRef(false);
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
          content: 'Saml de tre brikker, der er fremhævet i det første 3D-mål.',
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
  const { record: recordIntro } = useAttemptRecorder(introExercise);
  const progress = fixedLeftFirstBlockProgress(cubeState?.facelets ?? '');
  const isLiveReady =
    connection === 'connected' && cubeState?.synchronization === 'synchronized' && progress.valid;
  const goal = goalSteps[selectedGoal];
  const visiblePieces = pieceLabels.filter((piece) => piece.goal <= selectedGoal);

  const recordIntroduction = useCallback(async () => {
    if (introRecorded.current) return;
    introRecorded.current = true;
    await recordIntro({
      correct: true,
      hintsUsed: 0,
      answerRevealed: false,
      stage: 'teaching',
      fluentThresholdMs: 120_000,
    });
  }, [recordIntro]);

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
      setSelectedGoal(1);
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
      const nextProgress = fixedLeftFirstBlockProgress(nextState?.facelets ?? '');
      if (mode === 'live' && nextProgress.frontSquareComplete) setSelectedGoal(1);
      if (mode === 'live' && nextProgress.complete) void finishAttempt(true);
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
    setSelectedGoal(progress.frontSquareComplete ? 1 : 0);
    restartTimer();
    void recordIntroduction();
  };

  const restart = () => {
    setAttemptNumber((current) => current + 1);
    completionLocked.current = false;
    setCompletionMessage('');
    setMode('idle');
    setSelectedGoal(0);
    restartTimer();
  };

  const connectCube = async () => {
    if (connecting) return;
    setConnecting(true);
    setConnectionMessage('Leder efter en godkendt cube …');
    try {
      const remembered = await adapter.getRememberedCubes?.();
      if (remembered?.length === 1 && adapter.connectRemembered) {
        setConnectionMessage(`Forbinder direkte til ${remembered[0]!.name} …`);
        await adapter.connectRemembered(remembered[0]!.id);
      } else {
        setConnectionMessage('Åbner browserens Bluetooth-vindue …');
        await adapter.connect();
      }
      setConnection(adapter.getConnectionState());
      setCubeState(adapter.getCubeState());
      setConnectionMessage('GoCube er klar.');
    } catch (error) {
      setConnection(adapter.getConnectionState());
      setConnectionMessage(error instanceof Error ? error.message : 'Forbindelsen mislykkedes.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <section className="lesson-card first-block-course" aria-labelledby="first-block-course-title">
      <div className="stage-heading">
        <div>
          <p className="eyebrow">Se din cube og målet samtidig</p>
          <h2 id="first-block-course-title">Byg blokken i to synlige delmål</h2>
        </div>
        <span className={`status-pill ${isLiveReady ? 'good' : ''}`}>
          {isLiveReady ? 'GoCube følger med' : 'GoCube ikke forbundet'}
        </span>
      </div>

      <div className="first-block-goal-tabs" role="tablist" aria-label="Delmål for First Block">
        {goalSteps.map((step, index) => {
          const goalIndex = index as 0 | 1;
          const complete = goalIndex === 0 ? progress.frontSquareComplete : progress.complete;
          return (
            <button
              aria-selected={selectedGoal === goalIndex}
              className={selectedGoal === goalIndex ? 'active' : ''}
              key={step.shortTitle}
              onClick={() => setSelectedGoal(goalIndex)}
              role="tab"
              type="button"
            >
              <b>{complete ? '✓' : index + 1}</b>
              <span>
                <small>Delmål {index + 1}</small>
                <strong>{step.shortTitle}</strong>
              </span>
            </button>
          );
        })}
      </div>

      <div className="first-block-cube-comparison">
        <RouxPhaseCubePanel adapter={adapter} isLiveReady={isLiveReady}>
          {!isLiveReady && (
            <div className="first-block-connect-inline">
              <button
                className="button secondary compact"
                disabled={connecting || !adapter.isSupported()}
                onClick={() => void connectCube()}
                type="button"
              >
                {connecting ? 'Tilslutter …' : 'Tilslut GoCube'}
              </button>
              {connectionMessage && <small role="status">{connectionMessage}</small>}
            </div>
          )}
        </RouxPhaseCubePanel>

        <article className="first-block-cube-panel target">
          <header>
            <div>
              <p className="eyebrow">Dit delmål · {selectedGoal + 1} af 2</p>
              <h3>{goal.title}</h3>
            </div>
            <span className="target-badge">Mål</span>
          </header>
          <div className="first-block-viewer-frame target-view">
            <FirstBlockGoalViewer goal={selectedGoal} />
          </div>
          <p className="viewer-caption">
            {selectedGoal === 1
              ? 'Her ser du blokkens blå bagside. De klare orange-blå-gule felter afslutter hele blokken.'
              : 'De klare felter er dem, du bygger nu. De grå felter er kun pejlemærker.'}
          </p>
        </article>
      </div>

      <div className="first-block-instruction">
        <div>
          <span>Gør dette nu</span>
          <h3>{goal.title}</h3>
          <p>{goal.instruction}</p>
          <small>{goal.cue}</small>
        </div>
        <div className="first-block-piece-chips" aria-label="Brikker i dette delmål">
          {visiblePieces.map((piece) => {
            const solved = progress.solvedPieceIds.includes(piece.id);
            const isNew = piece.goal === selectedGoal;
            return (
              <span
                className={`${solved ? 'solved' : ''} ${isNew ? 'current' : ''}`}
                key={piece.id}
              >
                <b>{solved ? '✓' : '○'}</b>
                <span>
                  <strong>{piece.shortColors}</strong>
                  <small>{piece.label}</small>
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="first-block-action-row">
        <div className="first-block-progress-summary" aria-live="polite">
          <strong>{progress.valid ? progress.solvedPieceIds.length : '—'} af 5 brikker</strong>
          <span>
            {mode === 'live'
              ? progress.frontSquareComplete
                ? 'Firkanten er genkendt. Fortsæt med det bageste par.'
                : 'Appen skifter selv til delmål 2, når firkanten er samlet.'
              : 'Vælg live træning eller den manuelle reservevej.'}
          </span>
        </div>

        {mode === 'complete' ? (
          <div className="roux-practice-complete" role="status">
            <span aria-hidden="true">★</span>
            <strong>First Block gennemført</strong>
            <p>{completionMessage}</p>
            <button type="button" className="button primary" onClick={restart}>
              Træn én gang til
            </button>
          </div>
        ) : mode === 'manual' ? (
          <div className="first-block-mode-actions">
            <p>Sammenlign din fysiske cube med 3D-målet og bekræft, når alle fem brikker sidder.</p>
            <button
              type="button"
              className="button primary"
              onClick={() => void finishAttempt(false)}
            >
              Min First Block er samlet
            </button>
          </div>
        ) : mode === 'live' ? (
          <div className="first-block-mode-actions live" role="status">
            <span className="live-dot" aria-hidden="true" />
            <strong>Live-forsøget er i gang</strong>
            <p>Du behøver ikke bekræfte. GoCube afslutter forsøget, når blokken passer.</p>
          </div>
        ) : (
          <div className="first-block-mode-actions">
            {isLiveReady && !progress.complete && (
              <button type="button" className="button primary" onClick={() => start('live')}>
                Start med live GoCube
              </button>
            )}
            {isLiveReady && progress.complete && (
              <p>Bland først cuben, så mindst én af de fem målbrikker forlader blokken.</p>
            )}
            <button type="button" className="button secondary" onClick={() => start('manual')}>
              Start uden GoCube
            </button>
          </div>
        )}
      </div>

      <details className="first-block-hints">
        <summary>Jeg sidder fast</summary>
        <ol>
          <li>Du skal ikke kopiere resten af målcuben — kun de klare brikker tæller.</li>
          <li>Flyt et samlet par væk, før du skaber plads, og sæt det tilbage bagefter.</li>
          <li>Brug kun ydertræk i denne første etape. M og M′ er ikke nødvendige endnu.</li>
        </ol>
      </details>
    </section>
  );
}

export function RouxFirstBlockPage({
  cubeAdapter = physicalCubeAdapter,
}: {
  cubeAdapter?: SmartCubeAdapter;
}) {
  return (
    <div className="page roux-first-block-page">
      <header className="subject-hero ice first-block-hero">
        <div>
          <p className="eyebrow">Roux · etape 1 af 4</p>
          <h1>First Block</h1>
          <p>Din cube til venstre. Det næste mål til højre. Byg kun det, de klare felter viser.</p>
          <div className="first-block-hero-meta">
            <span>2 visuelle delmål</span>
            <span>Interaktiv live-cube</span>
            <span>Automatisk kontrol</span>
          </div>
        </div>
      </header>

      <nav className="lesson-breadcrumb" aria-label="Roux-navigation">
        <Link to="/fag/roux">Roux</Link>
        <span>→</span>
        <strong>First Block</strong>
      </nav>

      <FirstBlockCourse adapter={cubeAdapter} />

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
