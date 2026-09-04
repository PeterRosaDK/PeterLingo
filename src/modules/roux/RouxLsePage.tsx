import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { physicalCubeAdapter } from '../../hardware/smartcube/physicalCube';
import { fixedLseProgress } from '../../hardware/smartcube/state';
import type { ConnectionState, CubeState, SmartCubeAdapter } from '../../hardware/smartcube/types';
import type { GeneratedExercise } from '../../learning/types';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';
import { CubeViewer } from './CubeViewer';
import { RouxPhaseCubePanel } from './RouxPhaseCubePanel';
import { RouxQuickSolvePanel, type RouxQuickSolveTarget } from './RouxQuickSolvePanel';

export const ARROW_FRONT = "M' U M";
export const FRONT_SWAP = "M' U2 M";
export const BACK_SWAP = "M U2 M'";

export const LSE_SETUPS = [
  {
    id: 'eo',
    label: 'Delmål 1 · EO',
    title: 'Fire dårlige kanter',
    setup: "M' U' M",
    description: 'En ren pileopstilling. Løs den med M′ U M.',
  },
  {
    id: 'lr',
    label: 'Delmål 2 · L/R',
    title: 'Én L/R-kant i bunden',
    setup: "U M' U2 M U'",
    description:
      'Alle kanter er orienteret. Bring også den anden L/R-kant ned, justér U, og brug M2.',
  },
  {
    id: 'finish',
    label: 'Delmål 3 · afslut',
    title: 'Fire sidste kanter',
    setup: 'M2 U2 M2 U2',
    description: 'L/R-kanterne er allerede på plads relativt til hjørnerne. Løs de sidste fire.',
  },
] as const;

type LseSetup = (typeof LSE_SETUPS)[number];

const introExercise: GeneratedExercise<{ method: string; patterns: number }> = {
  id: 'roux:lse-intro:three-step:v1',
  learningUnitId: 'roux:lse-intro',
  discipline: 'roux',
  prompt: 'Forstå Last Six Edges i tre delmål',
  parameters: { method: 'beginner-three-step-lse', patterns: 2 },
  hints: [],
};

const lessonSteps = [
  {
    eyebrow: '1 · Se fasegrænsen',
    title: 'Kun seks kanter mangler',
    body: 'Begge blokke og alle fire hvide hjørner er færdige. Tilbage er de fire topkanter samt kanten foran og bagpå i midterskiven.',
    note: 'Du må nu holde blikket på kanterne. De færdige blokke og hjørner skal bevares.',
  },
  {
    eyebrow: '2 · Delmål EO',
    title: 'Vend alle hvide og gule stickers op eller ned',
    body: 'En god kant har sin hvide eller gule sticker på U- eller D-fladen. En dårlig kant viser den sticker ud til siden. Farven på kantens anden sticker er ligegyldig endnu.',
    note: 'Antallet af dårlige kanter er altid lige: 0, 2, 4 eller 6.',
  },
  {
    eyebrow: '3 · Første bevægelsesmønster',
    title: 'Løs pilen med et kvart U-træk i en M-sandwich',
    body: 'Når tre dårlige kanter på toppen danner et V og den fjerde er nedenunder, stiller du spidsen over bundkanten. Før begge op med M eller M′, drej U én kvart omgang, og før midten tilbage.',
    note: 'Husk idéen—ind, U, ud—frem for at lære mange særtilfælde.',
  },
  {
    eyebrow: '4 · Delmål L/R',
    title: 'Byt top og bund uden at ødelægge orienteringen',
    body: 'Find den hvid-orange og den hvid-røde kant. Brug samme sandwich, men med U2 i midten, til de står rigtigt relativt til de løste hjørner.',
    note: 'Frontbytte er M′ U2 M. Bagbytte er M U2 M′. Det er samme mønster spejlet.',
  },
  {
    eyebrow: '5 · Afslut',
    title: 'Løs de fire kanter omkring M-skiven',
    body: 'Når L/R-kanterne følger hjørnerne, mangler kun fire kanter. Brug U, M, U2 og M2 til at stille hvide kanter ved hvidt center og gule kanter ved gult center, indtil alle seks flader er ensfarvede.',
    note: 'M2 er ét dobbelttræk, ikke en ny algoritme. Appen godkender først, når hele cuben er løst.',
  },
] as const;

const displayAlg = (algorithm: string) => algorithm.replaceAll("'", '′');

function LseSlice({ oriented = false }: { oriented?: boolean }) {
  return (
    <div className={`lse-slice ${oriented ? 'oriented' : ''}`} aria-hidden="true">
      <span className="lse-edge back" />
      <span className="lse-edge left" />
      <i>U</i>
      <span className="lse-edge right" />
      <span className="lse-edge front" />
      <b>M</b>
      <small>GRØN FREM</small>
    </div>
  );
}

function PatternCard({
  name,
  algorithm,
  explanation,
}: {
  name: string;
  algorithm: string;
  explanation: string;
}) {
  return (
    <article className="lse-pattern-card">
      <small>{name}</small>
      <strong>{displayAlg(algorithm)}</strong>
      <p>{explanation}</p>
    </article>
  );
}

function LseLesson({ onFinish }: { onFinish(): void }) {
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
      fluentThresholdMs: 300_000,
    });
    setComplete(true);
    onFinish();
  };

  return (
    <section
      className="lesson-card first-block-lesson lse-lesson"
      aria-labelledby="lse-lesson-title"
    >
      <header>
        <div>
          <p className="eyebrow">{lesson.eyebrow}</p>
          <h2 id="lse-lesson-title">{lesson.title}</h2>
          <p>{lesson.body}</p>
        </div>
        <span className="ear-step-count">{step + 1}/5</span>
      </header>

      {step === 0 && (
        <div className="lse-objective">
          <LseSlice />
          <div>
            <strong>6 kanter</strong>
            <span>4 omkring U · 2 i M-skiven</span>
            <small>Alt andet er allerede løst.</small>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="lse-orientation-demo">
          <article>
            <b className="good-edge" />
            <strong>God kant</strong>
            <span>hvid/gul vender op eller ned</span>
          </article>
          <article>
            <b className="bad-edge" />
            <strong>Dårlig kant</strong>
            <span>hvid/gul vender ud til siden</span>
          </article>
        </div>
      )}
      {step === 2 && (
        <div className="lse-pattern-grid single">
          <PatternCard
            name="Pileeksempel"
            algorithm={ARROW_FRONT}
            explanation="M′ fører parret op, U drejer pilen, M fører skiven hjem. Spejlet bruger M U′ M′."
          />
        </div>
      )}
      {step === 3 && (
        <div className="lse-pattern-grid">
          <PatternCard
            name="Frontbytte"
            algorithm={FRONT_SWAP}
            explanation="Byt de to forreste M-kanter."
          />
          <PatternCard
            name="Bagbytte"
            algorithm={BACK_SWAP}
            explanation="Samme idé fra bagsiden."
          />
        </div>
      )}
      {step === 4 && (
        <div className="lse-three-steps">
          <span>
            <b>1</b>
            <strong>EO</strong>
            <small>6/6 gode kanter</small>
          </span>
          <i>→</i>
          <span>
            <b>2</b>
            <strong>L/R</strong>
            <small>følger hjørnerne</small>
          </span>
          <i>→</i>
          <span>
            <b>3</b>
            <strong>4C</strong>
            <small>hele cuben løst</small>
          </span>
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
            Jeg er klar til LSE
          </button>
        )}
      </div>
    </section>
  );
}

function LseSetupPicker({
  selected,
  onSelect,
}: {
  selected: LseSetup;
  onSelect(setup: LseSetup): void;
}) {
  return (
    <div className="cmll-setup-picker">
      <div className="cmll-setup-tabs" role="tablist" aria-label="Vælg LSE-øvelse">
        {LSE_SETUPS.map((setup) => (
          <button
            type="button"
            role="tab"
            aria-selected={selected.id === setup.id}
            key={setup.id}
            onClick={() => onSelect(setup)}
          >
            <small>{setup.label}</small>
            <strong>{setup.title}</strong>
          </button>
        ))}
      </div>
      <div className="second-block-setup cmll-setup">
        <div>
          <small>Opstilling fra løst cube · standardnotation</small>
          <strong aria-label="Aktuel LSE-opstilling">{displayAlg(selected.setup)}</strong>
          <p>{selected.description} Blokke og hjørner forbliver løst.</p>
        </div>
      </div>
    </div>
  );
}

function LsePractice({ adapter }: { adapter: SmartCubeAdapter }) {
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [cubeState, setCubeState] = useState<CubeState | null>(() => adapter.getCubeState());
  const [selectedSetup, setSelectedSetup] = useState<LseSetup>(LSE_SETUPS[0]);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [mode, setMode] = useState<'idle' | 'live' | 'manual' | 'complete'>('idle');
  const [completionMessage, setCompletionMessage] = useState('');
  const [preparing, setPreparing] = useState(false);
  const completionLocked = useRef(false);
  const exercise = useMemo<GeneratedExercise<{ mode: string; setup: string }>>(
    () => ({
      id: `roux:lse-practice:${selectedSetup.id}:${attemptNumber}`,
      learningUnitId: 'roux:lse-live',
      discipline: 'roux',
      prompt: 'Løs de sidste seks kanter med M og U',
      parameters: { mode: 'pending', setup: selectedSetup.id },
      hints: [
        {
          id: 'arrow',
          label: 'Vis pilemønstret',
          content: `${displayAlg(ARROW_FRONT)} · spejlet M U′ M′`,
        },
        {
          id: 'swaps',
          label: 'Vis kantbytter',
          content: `${displayAlg(FRONT_SWAP)} · ${displayAlg(BACK_SWAP)}`,
        },
        {
          id: 'finish',
          label: 'Husk afslutningen',
          content: 'Placér L/R relativt til hjørnerne; afslut derefter med U, M og M2.',
        },
      ],
    }),
    [attemptNumber, selectedSetup.id]
  );
  const { record, restartTimer } = useAttemptRecorder(exercise);
  const progress = fixedLseProgress(cubeState?.facelets ?? '');
  const isLiveReady =
    connection === 'connected' && cubeState?.synchronization === 'synchronized' && progress.valid;
  const activeMode =
    mode === 'idle' && isLiveReady && progress.cmllComplete && !progress.complete && !preparing
      ? 'live'
      : mode;
  const liveAttemptActive = useRef(false);
  const preparationTarget = useMemo<RouxQuickSolveTarget>(
    () => ({
      phaseName: 'Last Six Edges',
      setupAlgorithm: selectedSetup.setup,
      readyMessage:
        'Begge blokke og de fire tophjørner er bevaret. Luk klargøringen og løs nu kun de sidste seks kanter.',
    }),
    [selectedSetup.setup]
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
        fluentThresholdMs: 420_000,
        parameterOverrides: {
          mode: verifiedByCube ? 'live-gocube' : 'self-reported',
          verifiedByCube,
          setup: selectedSetup.id,
          patternCount: 2,
          algorithmCount: 0,
        },
      });
      setCompletionMessage(
        verifiedByCube
          ? 'GoCube har genkendt seks ensfarvede flader. Din første Roux-løsning er fuldført.'
          : 'Øvelsen er gemt som selvrapporteret LSE.'
      );
      setMode('complete');
    },
    [record, selectedSetup.id]
  );

  useEffect(() => {
    const inspect = (nextState: CubeState | null) => {
      setCubeState(nextState);
      setConnection(adapter.getConnectionState());
      const nextProgress = fixedLseProgress(nextState?.facelets ?? '');
      if (
        mode === 'idle' &&
        nextProgress.valid &&
        nextProgress.cmllComplete &&
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

  const liveCoach = !progress.blocksComplete
    ? 'Stop: en 1×2×3-blok er brudt. Genskab den, før LSE kan godkendes.'
    : !progress.cmllComplete
      ? 'Stop: hjørnerne er ikke længere løst relativt til hinanden. Gå tilbage til CMLL.'
      : !progress.edgesOriented
        ? `${progress.orientedEdgeCount}/6 kanter er gode. Find de hvide/gule stickers, der vender ud til siden, og byg en pil med M og U.`
        : !progress.lrEdgesRelative
          ? progress.lrEdgesOnBottomCount === 2
            ? 'Begge L/R-kanter står i bunden af M-skiven. Drej U, så hjørnerne passer, og udfør M2.'
            : `${progress.lrEdgesOnBottomCount}/2 L/R-kanter er klar i bunden. Brug front- eller bagbyttet med U2.`
          : 'EO og L/R er på plads. Løs de fire resterende kanter med U, M og M2; GoCube afslutter automatisk ved seks ensfarvede flader.';
  const targetStep = !progress.edgesOriented ? 0 : !progress.lrEdgesRelative ? 1 : 2;
  const targetTitles = [
    'Vend alle seks kanter rigtigt',
    'Placér den hvide-orange og hvide-røde kant',
    'Løs de sidste fire kanter',
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
      className={`lesson-card first-block-practice lse-practice ${activeMode === 'live' ? 'is-live' : ''}`}
      id="lse-practice"
      aria-labelledby="lse-practice-title"
    >
      <div className="stage-heading">
        <div>
          <p className="eyebrow">Etape 4 · fysisk træning</p>
          <h2 id="lse-practice-title">Løs cuben med M og U</h2>
        </div>
        <span className={`status-pill ${isLiveReady ? 'good' : ''}`}>
          {isLiveReady ? 'GoCube følger med' : 'Manuel træning mulig'}
        </span>
      </div>
      <p>Vælg ét delmål, udfør opstillingen fra løst cube, og løs uden yderlagsalgoritmer.</p>
      <div className="notation-policy">
        <strong>Kun M og U</strong>
        <span>Prime betyder modsat kvartdrejning; 2 betyder en halv omgang.</span>
      </div>

      <div className="phase-preparation-row">
        <p>
          Klargøringen kan føre enhver gyldig cube hertil og efterlader blokke og hjørner færdige.
        </p>
        <button className="button solve" onClick={() => setPreparing(true)} type="button">
          Løs hurtigt hertil
        </button>
      </div>

      <LseSetupPicker selected={selectedSetup} onSelect={setSelectedSetup} />

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
              ariaLabel="Delmål i 3D: Last Six Edges"
              cameraLatitude={-18}
              cameraLongitude={34}
              stickering={targetStep === 0 ? 'L6EO' : 'L6E'}
            />
          </div>
          <p className="viewer-caption">
            De klare felter er de seks kanter, du arbejder med. Blokke og hjørner skal blive
            færdige.
          </p>
        </article>
      </div>

      <div className="first-block-instruction phase-next-instruction" role="status">
        <div>
          <span>Gør dette nu</span>
          <h3>{targetTitles[targetStep]}</h3>
          <p>{liveCoach}</p>
          <small>Hold hvid/GO op og grøn frem. I denne fase bruger du kun M- og U-træk.</small>
        </div>
      </div>

      <div className="first-block-live-grid">
        <div className="first-block-progress-panel lse-progress-panel">
          <div className="block-progress-heading">
            <span>Live LSE</span>
            <strong>{progress.complete ? 'Løst' : `${progress.solvedFaceCount}/6 flader`}</strong>
          </div>
          <div className="block-progress-bar" aria-hidden="true">
            <span style={{ width: `${progress.solvedFaceCount * (100 / 6)}%` }} />
          </div>
          <div
            className={`first-block-guard ${progress.cmllComplete ? 'complete' : ''} ${!progress.valid ? 'unknown' : ''}`}
          >
            <b>{!progress.valid ? '·' : progress.cmllComplete ? '✓' : '!'}</b>
            <span>
              <strong>Blokke + CMLL</strong>
              <small>
                {!progress.valid
                  ? 'ikke aflæst'
                  : progress.cmllComplete
                    ? 'intakte'
                    : 'skal genskabes'}
              </small>
            </span>
          </div>
          <div className={`cmll-look-status ${progress.edgesOriented ? 'complete' : ''}`}>
            <b>{progress.edgesOriented ? '✓' : '1'}</b>
            <span>
              <strong>Kantorientering · EO</strong>
              <small>
                {progress.valid ? `${progress.orientedEdgeCount}/6 gode kanter` : 'ikke aflæst'}
              </small>
            </span>
          </div>
          <div className={`cmll-look-status ${progress.lrEdgesRelative ? 'complete' : ''}`}>
            <b>{progress.lrEdgesRelative ? '✓' : '2'}</b>
            <span>
              <strong>Venstre/højre-kanter</strong>
              <small>
                {progress.valid
                  ? `${progress.lrEdgesRelativeCount}/2 følger hjørnerne`
                  : 'ikke aflæst'}
              </small>
            </span>
          </div>
          <div className={`cmll-look-status ${progress.complete ? 'complete' : ''}`}>
            <b>{progress.complete ? '✓' : '3'}</b>
            <span>
              <strong>Fire sidste kanter · 4C</strong>
              <small>
                {progress.valid ? `${progress.solvedFaceCount}/6 ensfarvede flader` : 'ikke aflæst'}
              </small>
            </span>
          </div>
        </div>

        <aside className="first-block-coach">
          {mode === 'complete' ? (
            <div className="roux-practice-complete" role="status">
              <span aria-hidden="true">★</span>
              <strong>Hele cuben er løst</strong>
              <p>{completionMessage}</p>
              <button type="button" className="button primary" onClick={restart}>
                Træn én gang til
              </button>
            </div>
          ) : activeMode === 'live' ? (
            <div className="live-coach-message" role="status">
              <span className="live-dot" aria-hidden="true" />
              <strong>GoCube vurderer næste delmål</strong>
              <p>{liveCoach}</p>
            </div>
          ) : mode === 'manual' ? (
            <div className="live-coach-message">
              <strong>Træn uden aflæsning</strong>
              <p>Bekræft først, når alle seks flader er ensfarvede.</p>
              <button
                type="button"
                className="button primary"
                onClick={() => void finishAttempt(false)}
              >
                Hele min cube er løst
              </button>
            </div>
          ) : (
            <div className="first-block-start">
              {isLiveReady ? (
                !progress.cmllComplete ? (
                  <>
                    <p>Begge blokke og CMLL skal være færdige før LSE.</p>
                    <Link className="button secondary" to="/fag/roux/cmll">
                      Åbn CMLL
                    </Link>
                  </>
                ) : progress.complete ? (
                  <p>
                    LSE er allerede løst. Udfør den valgte opstilling ovenfor; derefter bliver
                    startknappen klar.
                  </p>
                ) : (
                  <p>GoCube starter automatisk kontrollen af Last Six Edges.</p>
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
            <summary>Vis mine to bevægelsesmønstre</summary>
            <ol>
              <li>
                <b>Pil:</b> {displayAlg(ARROW_FRONT)} · spejlet M U′ M′
              </li>
              <li>
                <b>Bytte:</b> {displayAlg(FRONT_SWAP)} · {displayAlg(BACK_SWAP)}
              </li>
              <li>M2 er et dobbelttræk, ikke en ekstra algoritme.</li>
            </ol>
          </details>
        </aside>
      </div>
    </section>
  );
}

export function RouxLsePage({
  cubeAdapter = physicalCubeAdapter,
}: {
  cubeAdapter?: SmartCubeAdapter;
}) {
  const revealPractice = () =>
    window.setTimeout(
      () =>
        document
          .getElementById('lse-practice')
          ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }),
      0
    );

  return (
    <div className="page roux-first-block-page roux-lse-page">
      <header className="subject-hero ice first-block-hero lse-hero">
        <div>
          <p className="eyebrow">Roux · etape 4 af 4</p>
          <h1>Last Six Edges</h1>
          <p>Orientér seks kanter, placér L/R-parret, og afslut hele cuben med kun M og U.</p>
          <div className="first-block-hero-meta">
            <span>3 delmål</span>
            <span>2 mønstre</span>
            <span>0 lange algoritmer</span>
            <span>Live GoCube-kontrol</span>
          </div>
        </div>
        <div className="cmll-hero-target lse-hero-target">
          <LseSlice oriented />
          <div>
            <span>Fasens mål</span>
            <strong>Hele cuben løst</strong>
            <p>Seks kanter · kun M- og U-træk.</p>
          </div>
        </div>
      </header>
      <nav className="lesson-breadcrumb" aria-label="Roux-navigation">
        <Link to="/fag/roux">Roux</Link>
        <span>→</span>
        <Link to="/fag/roux/cmll">CMLL</Link>
        <span>→</span>
        <strong>LSE</strong>
      </nav>
      <LsePractice adapter={cubeAdapter} />
      <LseLesson onFinish={revealPractice} />
      <section className="lesson-card algorithm-ladder cmll-ladder">
        <div>
          <p className="eyebrow">Færdighedsstigen</p>
          <h2>Intuitiv LSE nu · hurtigere genkendelse senere</h2>
          <p>
            Begyndermetoden bliver stående som fallback, selv når hurtigere LSE-teknikker åbnes.
          </p>
        </div>
        <ol>
          <li className="unlocked">
            <b>Nu</b>
            <span>
              <strong>Tre-trins LSE</strong>
              <small>EO → L/R → 4C · 2 mønstre</small>
            </span>
          </li>
          <li>
            <b>Senere</b>
            <span>
              <strong>EOLR</strong>
              <small>orientér og placér L/R samtidig</small>
            </span>
          </li>
          <li>
            <b>Avanceret</b>
            <span>
              <strong>4C-forudsigelse</strong>
              <small>se afslutningen før M2</small>
            </span>
          </li>
        </ol>
      </section>
      <p className="curriculum-source">
        Metodegrundlag:{' '}
        <a href="https://tutorial.rouxers.com/beginners/lse.html" target="_blank" rel="noreferrer">
          Rouxers’ begyndervejledning til LSE
        </a>
        . Farverne er tilpasset PeterLingos faste hvid-op, gul-ned-greb.
      </p>
      <div className="button-row page-footer-actions">
        <Link className="button secondary" to="/fag/roux/cmll">
          Tilbage til CMLL
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
