import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TwistyPlayerConfig } from 'cubing/twisty';
import { Link } from 'react-router-dom';
import { physicalCubeAdapter } from '../../hardware/smartcube/physicalCube';
import {
  fixedRightSecondBlockProgress,
  type FixedSecondBlockPieceId,
} from '../../hardware/smartcube/state';
import type { ConnectionState, CubeState, SmartCubeAdapter } from '../../hardware/smartcube/types';
import type { GeneratedExercise } from '../../learning/types';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import { CubeViewer } from './CubeViewer';
import { RouxPhaseCubePanel } from './RouxPhaseCubePanel';
import { RouxQuickSolvePanel, type RouxQuickSolveTarget } from './RouxQuickSolvePanel';

type StickeringMask = NonNullable<TwistyPlayerConfig['experimentalStickeringMaskOrbits']>;

const ignoredPiece = () => ({ facelets: Array.from({ length: 5 }, () => 'ignored' as const) });
const regularPiece = () => ({ facelets: Array.from({ length: 5 }, () => 'regular' as const) });
const dimPiece = () => ({ facelets: Array.from({ length: 5 }, () => 'dim' as const) });

function secondBlockSubgoalMask(step: 0 | 1): StickeringMask {
  const rightPieces = step === 0 ? { edges: [5], corners: [] } : { edges: [5, 8], corners: [4] };
  return {
    name: `PeterLingo Roux second block subgoal ${step + 1}`,
    orbits: {
      EDGES: {
        pieces: Array.from({ length: 12 }, (_, index) =>
          rightPieces.edges.includes(index)
            ? regularPiece()
            : [7, 9, 11].includes(index)
              ? dimPiece()
              : ignoredPiece()
        ),
      },
      CORNERS: {
        pieces: Array.from({ length: 8 }, (_, index) =>
          rightPieces.corners.includes(index)
            ? regularPiece()
            : [5, 6].includes(index)
              ? dimPiece()
              : ignoredPiece()
        ),
      },
      CENTERS: {
        pieces: Array.from({ length: 6 }, (_, index) =>
          index === 3 ? regularPiece() : index === 1 ? dimPiece() : ignoredPiece()
        ),
      },
    },
  };
}

const secondBlockSubgoalMasks = [secondBlockSubgoalMask(0), secondBlockSubgoalMask(1)] as const;

const introExercise: GeneratedExercise<{ block: string; beginnerAlgorithms: number }> = {
  id: 'roux:second-block-intro:right-down:v1',
  learningUnitId: 'roux:second-block-intro',
  discipline: 'roux',
  prompt: 'Forstå Second Block uden at ødelægge First Block',
  parameters: { block: 'fixed-right-down', beginnerAlgorithms: 2 },
  hints: [],
};

const lessonSteps = [
  {
    eyebrow: '1 · Se makkerblokken',
    title: 'Byg en rød-gul 1×2×3-blok nederst til højre',
    body: 'Second Block er samme form som First Block, bare på den modsatte side. Den røde centerbrik er blokkens faste midte, og blokken hviler over den gule bund.',
    note: 'Farverne er faste i begynderforløbet: orange blok til venstre, rød blok til højre.',
  },
  {
    eyebrow: '2 · Beskyt det færdige',
    title: 'Brug toppen og højre side som arbejdsområde',
    body: 'Hold hvid/GO op og grøn frem. U-træk flytter brikker rundt i toppen, og R-træk åbner højre side. Ingen af delene behøver at ødelægge den orange First Block.',
    note: 'I denne første runde bruger vi kun U, U′, U2, R, R′ og R2. Det er træknotation, ikke seks algoritmer.',
  },
  {
    eyebrow: '3 · Find fem nye brikker',
    title: 'Alt i Second Block indeholder rødt',
    body: 'Du skal igen bruge to hjørner og tre kanter. Den gul-røde DR-kant er blokkens bundryg; derefter kan du bygge enten den grønne eller den blå side først.',
    note: 'DR er navnet på brikken Down–Right. Det er ikke en kommando om at lave D efterfulgt af R.',
  },
  {
    eyebrow: '4 · Læg DR-kanten først',
    title: 'Giv blokken en fast bundkant',
    body: 'Find gul-rød-kanten og placer den mellem det gule og røde center. Når DR sidder, kan et hjørne-kant-par udvide den til en 1×2×2-firkant.',
    note: 'Hvis et tydeligt par allerede ligger klar, må du gerne tage det først. DR-først er en enkel standard, ikke en lov.',
  },
  {
    eyebrow: '5 · To små værktøjer',
    title: 'Indsæt et par med tre rigtige notationstræk',
    body: 'Når et hjørne-kant-par står rigtigt over sin plads, er de to første værktøjer R U R′ og R U′ R′. De åbner højre side, flytter toppen og lukker siden igen.',
    note: 'De virker kun fra en passende opstilling. Senere låser vi brede r-træk og M-genveje op; vi erstatter ikke forståelsen med en stor algoritmeliste.',
  },
] as const;

const pieceLabels: Array<{
  id: FixedSecondBlockPieceId;
  colors: string;
  label: string;
  position: string;
}> = [
  { id: 'bottom-edge', colors: 'gul · rød', label: 'bundkant', position: 'DR' },
  { id: 'front-corner', colors: 'gul · rød · grøn', label: 'forreste hjørne', position: 'DFR' },
  { id: 'front-edge', colors: 'grøn · rød', label: 'forreste kant', position: 'FR' },
  { id: 'back-corner', colors: 'gul · rød · blå', label: 'bageste hjørne', position: 'DBR' },
  { id: 'back-edge', colors: 'blå · rød', label: 'bageste kant', position: 'BR' },
];

export const SECOND_BLOCK_SETUPS = [
  "R U R' U' R' U R",
  "R U2 R' U R U' R'",
  "R' U' R U2 R U R'",
  "R2 U R U' R' U R2",
] as const;

function SecondBlockTarget() {
  return (
    <div
      className="first-block-target second-block-target"
      aria-label="Second Block omkring rød og gul"
    >
      <div className="first-block-cube" aria-hidden="true">
        <div className="block-face block-red">
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
        <span>Din anden faste blok</span>
        <strong>Rød til højre · gul i bunden</strong>
        <p>First Block skal stadig være samlet på den orange venstreside.</p>
      </div>
    </div>
  );
}

function SecondBlockLesson({ onFinish }: { onFinish(): void }) {
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
      fluentThresholdMs: 150_000,
    });
    setComplete(true);
    onFinish();
  };

  return (
    <section className="lesson-card first-block-lesson" aria-labelledby="second-block-lesson-title">
      <header>
        <div>
          <p className="eyebrow">{lesson.eyebrow}</p>
          <h2 id="second-block-lesson-title">{lesson.title}</h2>
          <p>{lesson.body}</p>
        </div>
        <span className="ear-step-count">{step + 1}/5</span>
      </header>

      {step === 0 && (
        <div className="fixed-block-pair">
          <span>
            <i className="orange-swatch" /> First Block · venstre
          </span>
          <b>fri M-skive</b>
          <span>
            <i className="red-swatch" /> Second Block · højre
          </span>
        </div>
      )}
      {step === 1 && (
        <div className="notation-toolbox" aria-label="Begynderens arbejdsområde">
          <div>
            <strong>U</strong>
            <span>toppen med uret</span>
          </div>
          <div>
            <strong>U′</strong>
            <span>toppen mod uret</span>
          </div>
          <div>
            <strong>U2</strong>
            <span>toppen en halv omgang</span>
          </div>
          <div>
            <strong>R</strong>
            <span>højre side med uret</span>
          </div>
          <div>
            <strong>R′</strong>
            <span>højre side mod uret</span>
          </div>
          <div>
            <strong>R2</strong>
            <span>højre side en halv omgang</span>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="first-block-piece-list second-block-piece-list">
          {pieceLabels.map((piece) => (
            <div key={piece.id}>
              <span>{piece.colors}</span>
              <strong>{piece.label}</strong>
              <small>{piece.position}</small>
            </div>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="block-recipe second-block-recipe">
          <span>DR · gul-rød kant</span>
          <b>+</b>
          <span>ét hjørne-kant-par</span>
          <strong>= første firkant</strong>
        </div>
      )}
      {step === 4 && (
        <div className="beginner-trigger-grid">
          <article>
            <small>Værktøj A</small>
            <strong>R U R′</strong>
            <span>åbn · flyt toppen · luk</span>
          </article>
          <article>
            <small>Værktøj B</small>
            <strong>R U′ R′</strong>
            <span>samme greb · modsat topretning</span>
          </article>
          <p>
            `'` hedder prime og betyder mod uret, når du ser direkte på den side, bogstavet
            beskriver. Appen skriver altid trækkene sådan i undervisningen.
          </p>
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
            Jeg er klar til Second Block
          </button>
        )}
      </div>
    </section>
  );
}

function SetupGenerator() {
  const [setupIndex, setSetupIndex] = useState(0);
  const setup = SECOND_BLOCK_SETUPS[setupIndex]!;
  const displayedSetup = setup.replaceAll("'", '′');
  return (
    <div className="second-block-setup">
      <div>
        <small>Øvelsesblanding fra løst cube</small>
        <strong aria-label="Aktuel øvelsesblanding">{displayedSetup}</strong>
        <p>
          Udfør den med hvid op og grøn frem. Den orange First Block bliver stående, mens højre
          arbejdsområde bliver blandet.
        </p>
      </div>
      <button
        type="button"
        className="button secondary"
        onClick={() => setSetupIndex((current) => (current + 1) % SECOND_BLOCK_SETUPS.length)}
      >
        Ny øvelsesblanding
      </button>
    </div>
  );
}

function SecondBlockPractice({ adapter }: { adapter: SmartCubeAdapter }) {
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [cubeState, setCubeState] = useState<CubeState | null>(() => adapter.getCubeState());
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [mode, setMode] = useState<'idle' | 'live' | 'manual' | 'complete'>('idle');
  const [completionMessage, setCompletionMessage] = useState('');
  const [preparing, setPreparing] = useState(false);
  const completionLocked = useRef(false);
  const exercise = useMemo<GeneratedExercise<{ mode: string; block: string }>>(
    () => ({
      id: `roux:second-block-practice:${attemptNumber}`,
      learningUnitId: 'roux:second-block-live',
      discipline: 'roux',
      prompt: 'Byg den faste højre Second Block og bevar First Block',
      parameters: { mode: 'pending', block: 'fixed-right-down' },
      hints: [
        {
          id: 'dr-edge',
          label: 'Find bundkanten',
          content: 'Placér først gul-rød-kanten mellem det gule og røde center.',
        },
        {
          id: 'right-pair',
          label: 'Byg et par',
          content: 'Saml et rødt hjørne med kanten, der deler hjørnets tredje farve.',
        },
      ],
    }),
    [attemptNumber]
  );
  const { record, restartTimer } = useAttemptRecorder(exercise);
  const progress = fixedRightSecondBlockProgress(cubeState?.facelets ?? '');
  const isLiveReady =
    connection === 'connected' && cubeState?.synchronization === 'synchronized' && progress.valid;
  const activeMode =
    mode === 'idle' &&
    isLiveReady &&
    progress.firstBlockComplete &&
    !progress.complete &&
    !preparing
      ? 'live'
      : mode;
  const liveAttemptActive = useRef(false);
  const preparationTarget = useMemo<RouxQuickSolveTarget>(
    () => ({
      phaseName: 'Second Block',
      setupAlgorithm: SECOND_BLOCK_SETUPS[0],
      readyMessage:
        'Den orange First Block er bevaret, og højre side er gjort klar. Luk klargøringen og begynd direkte på Second Block.',
    }),
    []
  );

  const finishAttempt = useCallback(
    async (verifiedByCube: boolean) => {
      if (completionLocked.current) return;
      completionLocked.current = true;
      await record({
        correct: true,
        hintsUsed: 0,
        answerRevealed: false,
        stage: verifiedByCube ? 'unassisted' : 'assisted',
        fluentThresholdMs: 240_000,
        parameterOverrides: {
          mode: verifiedByCube ? 'live-gocube' : 'self-reported',
          verifiedByCube,
          firstBlockRequired: true,
        },
      });
      setCompletionMessage(
        verifiedByCube
          ? 'GoCube har genkendt begge blokke. First Block er bevaret, og alle fem nye målbrikker sidder.'
          : 'Øvelsen er gemt som selvrapporteret træning af begge blokke.'
      );
      setMode('complete');
    },
    [record]
  );

  useEffect(() => {
    const inspect = (nextState: CubeState | null) => {
      setCubeState(nextState);
      setConnection(adapter.getConnectionState());
      const nextProgress = fixedRightSecondBlockProgress(nextState?.facelets ?? '');
      if (
        mode === 'idle' &&
        nextProgress.valid &&
        nextProgress.firstBlockComplete &&
        !nextProgress.complete
      ) {
        liveAttemptActive.current = true;
      }
      if (mode !== 'manual' && liveAttemptActive.current && nextProgress.complete) {
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

  const liveCoachText = !progress.firstBlockComplete
    ? 'Stop et øjeblik: den orange First Block er brudt. Genskab den med standardnotation, før du fortsætter på højre side.'
    : !progress.bottomEdgeComplete
      ? 'Find DR-kanten — gul-rød — og placér den mellem de to centre.'
      : !progress.oneSquareComplete
        ? 'DR sidder. Saml nu enten det grøn-røde eller blå-røde hjørne-kant-par.'
        : 'Den første firkant er samlet. Bevar den og indsæt det sidste røde par.';
  const targetStep = !progress.bottomEdgeComplete ? 0 : !progress.oneSquareComplete ? 1 : 2;
  const targetTitles = [
    'Placér den gul-røde bundkant',
    'Byg den første røde firkant',
    'Indsæt det sidste røde par',
  ];
  const targetCaptions = [
    'Kun den klare gul-røde kant er målet nu. Den dæmpede orange blok til venstre skal blive stående.',
    'De tre klare brikker danner den forreste røde firkant. Den dæmpede orange blok skal blive stående.',
    'Alle klare felter afslutter den røde blok til højre. Den dæmpede orange blok skal stadig blive stående.',
  ];

  if (preparing) {
    return (
      <RouxQuickSolvePanel
        adapter={adapter}
        onClose={() => setPreparing(false)}
        target={preparationTarget}
      />
    );
  }

  return (
    <section
      className={`lesson-card first-block-practice second-block-practice ${activeMode === 'live' ? 'is-live' : ''}`}
      id="second-block-practice"
      aria-labelledby="second-block-practice-title"
    >
      <div className="stage-heading">
        <div>
          <p className="eyebrow">Etape 2 · fysisk træning</p>
          <h2 id="second-block-practice-title">Byg blok nummer to</h2>
        </div>
        <span className={`status-pill ${isLiveReady ? 'good' : ''}`}>
          {isLiveReady ? 'GoCube følger med' : 'Manuel træning mulig'}
        </span>
      </div>
      <p>
        Begynd med den orange First Block samlet. Byg derefter den røde blok til højre uden at
        flytte referencegrebet.
      </p>
      <div className="notation-policy">
        <strong>Notation i læringssporet</strong>
        <span>Træk skrives som R, U, R′ og U2. Farverne identificerer kun sider og brikker.</span>
      </div>

      <div className="phase-preparation-row">
        <p>
          Er cuben ikke klar til denne fase? Klargøringen løser den først og laver derefter en
          opstilling, hvor First Block bevares.
        </p>
        <button className="button solve" onClick={() => setPreparing(true)} type="button">
          Løs hurtigt hertil
        </button>
      </div>

      <SetupGenerator />

      <div className="first-block-cube-comparison phase-cube-comparison">
        <RouxPhaseCubePanel adapter={adapter} isLiveReady={isLiveReady} />
        <article className="first-block-cube-panel target">
          <header>
            <div>
              <p className="eyebrow">Dit delmål · {targetStep + 1} af 3</p>
              <h3>{targetTitles[targetStep]}</h3>
            </div>
            <span className="target-badge">Mål</span>
          </header>
          <div className="first-block-viewer-frame target-view">
            <CubeViewer
              allowDrag={false}
              ariaLabel={`Delmål i 3D: ${targetTitles[targetStep]}`}
              cameraLatitude={-18}
              cameraLongitude={34}
              stickering={targetStep === 2 ? 'SecondBlock' : null}
              stickeringMask={targetStep === 2 ? undefined : secondBlockSubgoalMasks[targetStep]}
            />
          </div>
          <p className="viewer-caption">{targetCaptions[targetStep]}</p>
        </article>
      </div>

      <div className="first-block-instruction phase-next-instruction" role="status">
        <div>
          <span>Gør dette nu</span>
          <h3>{targetTitles[targetStep]}</h3>
          <p>{liveCoachText}</p>
          <small>Hvid/GO op · grøn frem. Brug toppen som arbejdsbord og åbn kun højre side.</small>
        </div>
      </div>

      <div className="first-block-live-grid">
        <div className="first-block-progress-panel second-block-progress-panel">
          <div className="block-progress-heading">
            <span>Live målbrikker i Second Block</span>
            <strong>{progress.valid ? progress.solvedPieceIds.length : '—'}/5</strong>
          </div>
          <div className="block-progress-bar" aria-hidden="true">
            <span style={{ width: `${progress.solvedPieceIds.length * 20}%` }} />
          </div>
          <div
            className={`first-block-guard ${progress.valid && progress.firstBlockComplete ? 'complete' : ''} ${!progress.valid ? 'unknown' : ''}`}
          >
            <b>{!progress.valid ? '·' : progress.firstBlockComplete ? '✓' : '!'}</b>
            <span>
              <strong>Orange First Block</strong>
              <small>
                {!progress.valid
                  ? 'ikke aflæst'
                  : progress.firstBlockComplete
                    ? 'bevaret'
                    : 'skal genskabes'}
              </small>
            </span>
          </div>
          <div className="block-piece-status">
            {pieceLabels.map((piece) => {
              const solved = progress.solvedPieceIds.includes(piece.id);
              return (
                <div className={solved ? 'solved' : ''} key={piece.id}>
                  <b>{solved ? '✓' : progress.valid ? '○' : '·'}</b>
                  <span>
                    <strong>{piece.colors}</strong>
                    <small>
                      {piece.label} · {piece.position}
                    </small>
                  </span>
                </div>
              );
            })}
          </div>
          <div className={`subgoal-status ${progress.bottomEdgeComplete ? 'complete' : ''}`}>
            <b>{progress.bottomEdgeComplete ? '✓' : '1'}</b>
            <span>
              <strong>DR-bundkant</strong>
              <small>{progress.bottomEdgeComplete ? 'på plads' : 'gul-rød kant'}</small>
            </span>
          </div>
          <div className={`subgoal-status ${progress.oneSquareComplete ? 'complete' : ''}`}>
            <b>{progress.oneSquareComplete ? '✓' : '2'}</b>
            <span>
              <strong>Første firkant</strong>
              <small>{progress.oneSquareComplete ? 'samlet' : 'tilføj ét par'}</small>
            </span>
          </div>
          <div className={`subgoal-status ${progress.complete ? 'complete' : ''}`}>
            <b>{progress.complete ? '✓' : '3'}</b>
            <span>
              <strong>Begge Roux-blokke</strong>
              <small>{progress.complete ? 'samlet' : 'indsæt sidste par'}</small>
            </span>
          </div>
        </div>

        <aside className="first-block-coach">
          {mode === 'complete' ? (
            <div className="roux-practice-complete" role="status">
              <span aria-hidden="true">★</span>
              <strong>Second Block gennemført</strong>
              <p>{completionMessage}</p>
              <button type="button" className="button primary" onClick={restart}>
                Træn én gang til
              </button>
            </div>
          ) : activeMode === 'live' ? (
            <div className="live-coach-message" role="status">
              <span className="live-dot" aria-hidden="true" />
              <strong>GoCube følger automatisk med</strong>
              <p>{liveCoachText}</p>
            </div>
          ) : mode === 'manual' ? (
            <div className="live-coach-message">
              <strong>Træn uden aflæsning</strong>
              <p>Kontrollér både den orange og den røde blok, før du godkender forsøget.</p>
              <button
                type="button"
                className="button primary"
                onClick={() => void finishAttempt(false)}
              >
                Begge blokke er samlet
              </button>
            </div>
          ) : (
            <div className="first-block-start">
              {isLiveReady ? (
                !progress.firstBlockComplete ? (
                  <>
                    <p>
                      First Block mangler. Byg den orange blok først; GoCube åbner derefter denne
                      etape.
                    </p>
                    <Link className="button secondary" to="/fag/roux/first-block">
                      Åbn First Block
                    </Link>
                  </>
                ) : progress.complete ? (
                  <p>
                    Begge blokke er allerede samlet. Udfør øvelsesblandingen ovenfor; derefter
                    bliver startknappen klar.
                  </p>
                ) : (
                  <p>GoCube starter automatisk kontrollen af Second Block.</p>
                )
              ) : (
                <>
                  <p>
                    Forbind GoCube for automatisk kontrol, eller øv med din egen visuelle kontrol.
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
              <li>Kontrollér først, at orange First Block stadig er hel.</li>
              <li>Find gul-rød-kanten (DR), og læg den mellem de gule og røde centre.</li>
              <li>Lav toppen til arbejdsbord med U eller U′; åbn kun højre side med R eller R′.</li>
              <li>Brug R U R′ eller R U′ R′, når et par står korrekt over sin plads.</li>
            </ol>
          </details>
        </aside>
      </div>
    </section>
  );
}

export function RouxSecondBlockPage({
  cubeAdapter = physicalCubeAdapter,
}: {
  cubeAdapter?: SmartCubeAdapter;
}) {
  const revealPractice = () => {
    window.setTimeout(() => {
      document
        .getElementById('second-block-practice')
        ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <div className="page roux-first-block-page roux-second-block-page">
      <header className="subject-hero ice first-block-hero second-block-hero">
        <div>
          <p className="eyebrow">Roux · etape 2</p>
          <h1>Second Block</h1>
          <p>Byg spejlbilledet på højre side, mens din første blok bliver stående.</p>
          <div className="first-block-hero-meta">
            <span>Faste begynderfarver</span>
            <span>Kun 2 korte værktøjer</span>
            <span>Live kontrol af begge blokke</span>
          </div>
        </div>
        <SecondBlockTarget />
      </header>

      <nav className="lesson-breadcrumb" aria-label="Roux-navigation">
        <Link to="/fag/roux">Roux</Link>
        <span>→</span>
        <Link to="/fag/roux/first-block">First Block</Link>
        <span>→</span>
        <strong>Second Block</strong>
      </nav>

      <SecondBlockPractice adapter={cubeAdapter} />
      <SecondBlockLesson onFinish={revealPractice} />

      <section className="lesson-card algorithm-ladder" aria-labelledby="algorithm-ladder-title">
        <div>
          <p className="eyebrow">Senere · algoritmestigen</p>
          <h2 id="algorithm-ladder-title">Genveje kommer først, når fundamentet er sikkert</h2>
          <p>
            Begyndertrinnet bruger kun R/U og to korte indsætninger. Derefter kan vi måle, om en ny
            genvej faktisk sparer træk eller tid.
          </p>
        </div>
        <ol>
          <li className="unlocked">
            <b>Nu</b>
            <span>
              <strong>R/U-grundform</strong>
              <small>R U R′ · R U′ R′</small>
            </span>
          </li>
          <li>
            <b>Senere</b>
            <span>
              <strong>Bred højreindsætning</strong>
              <small>r U r′ · r U′ r′</small>
            </span>
          </li>
          <li>
            <b>Efter M-test</b>
            <span>
              <strong>M-baserede genveje</strong>
              <small>låses op med fysisk verificeret mapping</small>
            </span>
          </li>
        </ol>
      </section>

      <p className="curriculum-source">
        Metodegrundlag:{' '}
        <a
          href="https://tutorial.rouxers.com/intermediate/second-block.html"
          target="_blank"
          rel="noreferrer"
        >
          Rouxers’ Second Block-vejledning
        </a>
        . PeterLingo gør begyndelsen smallere med fast farveramme og kun R/U-værktøjerne.
      </p>
      <div className="button-row page-footer-actions">
        <Link className="button primary" to="/fag/roux/cmll">
          Fortsæt til begynder-CMLL
        </Link>
        <Link className="button secondary" to="/fag/roux/first-block">
          Tilbage til First Block
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
