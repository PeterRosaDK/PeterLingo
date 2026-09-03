import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { physicalCubeAdapter } from '../../hardware/smartcube/physicalCube';
import { fixedCmllProgress } from '../../hardware/smartcube/state';
import type { ConnectionState, CubeState, SmartCubeAdapter } from '../../hardware/smartcube/types';
import type { GeneratedExercise } from '../../learning/types';
import { useAttemptRecorder } from '../../learning/useAttemptRecorder';

export const SUNE = "R U R' U R U2 R'";
export const T_PERM = "R U R' U' R' F R2 U' R' U' R U R' F'";

export const CMLL_SETUPS = [
  {
    id: 'orientation',
    title: 'Kun hvide stickers',
    label: 'Kig 1 · orientering',
    setup: "R U2 R' U' R U' R'",
    description: 'Én Sune bringer denne rolige opstilling tilbage.',
  },
  {
    id: 'permutation',
    title: 'Headlights på venstre side',
    label: 'Kig 2 · permutation',
    setup: T_PERM,
    description: 'Alle hvide stickers vender op; T-perm sætter hjørnerne tilbage.',
  },
  {
    id: 'both',
    title: 'Begge kig i rækkefølge',
    label: 'Samlet CMLL',
    setup: `${T_PERM} R U2 R' U' R U' R'`,
    description: 'Orientér først med Sune, og permutér derefter med T-perm.',
  },
] as const;

type CmllSetup = (typeof CMLL_SETUPS)[number];

const introExercise: GeneratedExercise<{ method: string; algorithms: number }> = {
  id: 'roux:cmll-intro:two-look:v1',
  learningUnitId: 'roux:cmll-intro',
  discipline: 'roux',
  prompt: 'Løs de fire øverste hjørner i to kig',
  parameters: { method: 'two-look-cmll', algorithms: 2 },
  hints: [],
};

const lessonSteps = [
  {
    eyebrow: '1 · Se fasegrænsen',
    title: 'CMLL løser kun de fire øverste hjørner',
    body: 'Begge 1×2×3-blokke er færdige. Nu skal de fire hjørner omkring den hvide top både vende rigtigt og stå på rette plads. De seks uløste kanter må gerne flytte sig.',
    note: 'Hos os er hvid CMLL-farven, fordi hvid/GO er oppe og gul er nede i hele begynderforløbet.',
  },
  {
    eyebrow: '2 · To kig',
    title: 'Først retning, derefter placering',
    body: 'Orientering betyder, at alle fire hvide hjørnestickers vender op. Permutation betyder, at hjørnernes sidefarver bagefter passer med centrene.',
    note: 'Ignorér topkanterne. De hører til fjerde fase, LSE.',
  },
  {
    eyebrow: '3 · Kig 1',
    title: 'Brug Sune til at vende hjørnerne',
    body: 'Sune genbruger det korte R U R′-værktøj fra Second Block. Fra den rigtige U-vinkel skal den muligvis udføres mere end én gang, men det er stadig kun én algoritme.',
    note: 'Har du præcis ét hvidt hjørne opad, så placér det forrest til venstre med U, U′ eller U2 før Sune.',
  },
  {
    eyebrow: '4 · Kig 2',
    title: 'Find et sæt “forlygter”',
    body: 'Når to hjørnestickers med samme farve står ved siden af hinanden på én side, ligner de et par forlygter. Flyt dem til den orange venstreside med U-træk.',
    note: 'Ser du ingen forlygter, udfør T-perm én gang fra en vilkårlig vinkel. Derefter kommer et par frem.',
  },
  {
    eyebrow: '5 · Den anden og sidste algoritme',
    title: 'T-perm bytter de to højre hjørner',
    body: 'Med forlygterne til venstre udfører du T-perm. Algoritmen påvirker topkanterne, men det er tilladt; den genskaber begge blokke og løser hjørnerne.',
    note: 'Til sidst kan et enkelt U, U′ eller U2 være nødvendigt, så sidefarverne flugter med centrene.',
  },
] as const;

const displayAlg = (algorithm: string) => algorithm.replaceAll("'", '′');

function CmllTop({ oriented = false }: { oriented?: boolean }) {
  return (
    <div className={`cmll-top ${oriented ? 'oriented' : ''}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => (
        <i
          className={[0, 2, 6, 8].includes(index) ? 'corner' : index === 4 ? 'center' : ''}
          key={index}
        />
      ))}
      <span>GRØN FREM</span>
    </div>
  );
}

function AlgorithmCard({
  name,
  algorithm,
  chunks,
}: {
  name: string;
  algorithm: string;
  chunks: string[];
}) {
  return (
    <div className="cmll-algorithm-card">
      <div>
        <small>{name}</small>
        <strong>{displayAlg(algorithm)}</strong>
      </div>
      <ol aria-label={`${name} opdelt i bidder`}>
        {chunks.map((chunk, index) => (
          <li key={`${chunk}-${index}`}>
            <b>{index + 1}</b>
            <span>{displayAlg(chunk)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CmllLesson({ onFinish }: { onFinish(): void }) {
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
      fluentThresholdMs: 240_000,
    });
    setComplete(true);
    onFinish();
  };

  return (
    <section
      className="lesson-card first-block-lesson cmll-lesson"
      aria-labelledby="cmll-lesson-title"
    >
      <header>
        <div>
          <p className="eyebrow">{lesson.eyebrow}</p>
          <h2 id="cmll-lesson-title">{lesson.title}</h2>
          <p>{lesson.body}</p>
        </div>
        <span className="ear-step-count">{step + 1}/5</span>
      </header>

      {step === 0 && (
        <div className="cmll-objective">
          <CmllTop oriented />
          <div>
            <strong>Fire hjørner løst</strong>
            <span>hvide stickers op · sidefarver ved deres centre</span>
            <small>Topkanterne er med vilje ikke en del af målet.</small>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="cmll-two-look">
          <article>
            <b>01</b>
            <CmllTop />
            <strong>Orientér</strong>
            <span>Få 4/4 hvide hjørner op.</span>
          </article>
          <i>→</i>
          <article>
            <b>02</b>
            <CmllTop oriented />
            <strong>Permutér</strong>
            <span>Match alle fire sidefarver.</span>
          </article>
        </div>
      )}
      {step === 2 && (
        <AlgorithmCard
          name="Algoritme 1 · Sune"
          algorithm={SUNE}
          chunks={["R U R'", 'U', "R U2 R'"]}
        />
      )}
      {step === 3 && (
        <div className="headlights-explainer">
          <div className="headlight-face">
            <i />
            <i />
            <span>samme farve</span>
          </div>
          <div>
            <strong>Forlygter til venstre</strong>
            <p>Brug kun U, U′ eller U2 til at flytte det fundne par hen på den orange L-side.</p>
          </div>
        </div>
      )}
      {step === 4 && (
        <AlgorithmCard
          name="Algoritme 2 · T-perm"
          algorithm={T_PERM}
          chunks={["R U R' U'", "R' F R2", "U' R' U'", "R U R' F'"]}
        />
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
            Næste kig
          </button>
        ) : complete ? (
          <span className="status-pill good">Introduktion gennemført</span>
        ) : (
          <button className="button primary" type="button" onClick={() => void finish()}>
            Jeg er klar til CMLL
          </button>
        )}
      </div>
    </section>
  );
}

function CmllSetupPicker({
  selected,
  onSelect,
}: {
  selected: CmllSetup;
  onSelect(setup: CmllSetup): void;
}) {
  return (
    <div className="cmll-setup-picker">
      <div className="cmll-setup-tabs" role="tablist" aria-label="Vælg CMLL-øvelse">
        {CMLL_SETUPS.map((setup) => (
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
          <strong aria-label="Aktuel CMLL-opstilling">{displayAlg(selected.setup)}</strong>
          <p>{selected.description} Begge 1×2×3-blokke er intakte, når opstillingen er færdig.</p>
        </div>
      </div>
    </div>
  );
}

const headlightNames: Record<string, string> = {
  F: 'F · grøn',
  R: 'R · rød',
  B: 'B · blå',
  L: 'L · orange',
};

function CmllPractice({ adapter }: { adapter: SmartCubeAdapter }) {
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [cubeState, setCubeState] = useState<CubeState | null>(() => adapter.getCubeState());
  const [selectedSetup, setSelectedSetup] = useState<CmllSetup>(CMLL_SETUPS[0]);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [mode, setMode] = useState<'idle' | 'live' | 'manual' | 'complete'>('idle');
  const [completionMessage, setCompletionMessage] = useState('');
  const completionLocked = useRef(false);
  const exercise = useMemo<GeneratedExercise<{ mode: string; setup: string }>>(
    () => ({
      id: `roux:cmll-practice:${selectedSetup.id}:${attemptNumber}`,
      learningUnitId: 'roux:cmll-live',
      discipline: 'roux',
      prompt: 'Løs de fire øverste hjørner med to-look CMLL',
      parameters: { mode: 'pending', setup: selectedSetup.id },
      hints: [
        { id: 'sune', label: 'Vis Sune', content: displayAlg(SUNE) },
        {
          id: 'headlights',
          label: 'Find forlygter',
          content: 'Flyt et ensfarvet hjørnepar til L-siden.',
        },
        { id: 't-perm', label: 'Vis T-perm', content: displayAlg(T_PERM) },
      ],
    }),
    [attemptNumber, selectedSetup.id]
  );
  const { record, restartTimer } = useAttemptRecorder(exercise);
  const progress = fixedCmllProgress(cubeState?.facelets ?? '');
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
        fluentThresholdMs: 300_000,
        parameterOverrides: {
          mode: verifiedByCube ? 'live-gocube' : 'self-reported',
          verifiedByCube,
          setup: selectedSetup.id,
          algorithmCount: 2,
        },
      });
      setCompletionMessage(
        verifiedByCube
          ? 'GoCube har genkendt begge blokke og alle fire løste tophjørner.'
          : 'Øvelsen er gemt som selvrapporteret to-look CMLL.'
      );
      setMode('complete');
    },
    [record, selectedSetup.id]
  );

  useEffect(() => {
    const inspect = (nextState: CubeState | null) => {
      setCubeState(nextState);
      setConnection(adapter.getConnectionState());
      if (mode === 'live' && fixedCmllProgress(nextState?.facelets ?? '').complete)
        void finishAttempt(true);
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
    ? 'Stop: en af de to blokke er brudt. Genskab orange venstreblok og rød højreblok, før hjørnetrinnet kan godkendes.'
    : !progress.cornersOriented
      ? progress.orientedCornerCount === 1 && progress.orientedCornerIds.includes('front-left')
        ? `Det ene hvide hjørne står forrest til venstre. Udfør Sune: ${displayAlg(SUNE)}`
        : progress.orientedCornerCount === 1
          ? 'Flyt det ene hvide tophjørne til forrest-venstre med U, U′ eller U2. Udfør derefter Sune.'
          : `Kig kun efter hvid på toppen. Vælg en U-vinkel, udfør Sune og vurder igen: ${displayAlg(SUNE)}`
      : progress.solvedCornerIds.length === 4
        ? 'Hjørnerne er løst. Vent på GoCubens næste synkroniserede tilstand.'
        : progress.headlightFaces.length === 4
          ? 'Alle fire forlygtepar findes: hjørnerne er indbyrdes løst. Brug U, U′ eller U2, indtil sidefarverne matcher centrene.'
          : progress.headlightFaces.includes('L')
            ? `Forlygterne står på L-siden. Udfør T-perm: ${displayAlg(T_PERM)}`
            : progress.headlightFaces.length
              ? `Forlygterne står ved ${progress.headlightFaces.map((face) => headlightNames[face]).join(', ')}. Flyt dem til L · orange med U-træk.`
              : `Ingen forlygter endnu. Udfør T-perm én gang; find derefter det nye par: ${displayAlg(T_PERM)}`;

  return (
    <section
      className={`lesson-card first-block-practice cmll-practice ${mode === 'live' ? 'is-live' : ''}`}
      id="cmll-practice"
      aria-labelledby="cmll-practice-title"
    >
      <div className="stage-heading">
        <div>
          <p className="eyebrow">Etape 3 · fysisk træning</p>
          <h2 id="cmll-practice-title">Løs hjørnerne i to kig</h2>
        </div>
        <span className={`status-pill ${isLiveReady ? 'good' : ''}`}>
          {isLiveReady ? 'GoCube følger med' : 'Manuel træning mulig'}
        </span>
      </div>
      <p>
        Vælg ét lille fokus, lav opstillingen fra løst cube, og lad de seks top-/midterkanter være
        ligeglade.
      </p>
      <div className="notation-policy">
        <strong>Kun standardnotation</strong>
        <span>
          Farver bruges til genkendelse. Hvert fysisk træk vises som bogstav, prime eller 2.
        </span>
      </div>

      <CmllSetupPicker selected={selectedSetup} onSelect={setSelectedSetup} />

      <div className="first-block-live-grid">
        <div className="first-block-progress-panel cmll-progress-panel">
          <div className="block-progress-heading">
            <span>Live CMLL</span>
            <strong>{progress.valid ? progress.solvedCornerIds.length : '—'}/4 løst</strong>
          </div>
          <div className="block-progress-bar" aria-hidden="true">
            <span style={{ width: `${progress.solvedCornerIds.length * 25}%` }} />
          </div>
          <div
            className={`first-block-guard ${progress.valid && progress.blocksComplete ? 'complete' : ''} ${!progress.valid ? 'unknown' : ''}`}
          >
            <b>{!progress.valid ? '·' : progress.blocksComplete ? '✓' : '!'}</b>
            <span>
              <strong>Begge 1×2×3-blokke</strong>
              <small>
                {!progress.valid
                  ? 'ikke aflæst'
                  : progress.blocksComplete
                    ? 'intakte'
                    : 'skal genskabes'}
              </small>
            </span>
          </div>
          <div className={`cmll-look-status ${progress.cornersOriented ? 'complete' : ''}`}>
            <b>{progress.cornersOriented ? '✓' : '1'}</b>
            <span>
              <strong>Hvide hjørner op</strong>
              <small>
                {progress.valid ? `${progress.orientedCornerCount}/4 orienteret` : 'ikke aflæst'}
              </small>
            </span>
          </div>
          <div className={`cmll-look-status ${progress.complete ? 'complete' : ''}`}>
            <b>{progress.complete ? '✓' : '2'}</b>
            <span>
              <strong>Hjørner på rette plads</strong>
              <small>
                {progress.valid
                  ? `${progress.solvedCornerIds.length}/4 matcher centrene`
                  : 'ikke aflæst'}
              </small>
            </span>
          </div>
          <div className="headlight-status">
            <small>Forlygter registreret</small>
            <strong>
              {progress.cornersOriented && progress.headlightFaces.length
                ? progress.headlightFaces.map((face) => headlightNames[face]).join(' · ')
                : '—'}
            </strong>
          </div>
        </div>

        <aside className="first-block-coach">
          {mode === 'complete' ? (
            <div className="roux-practice-complete" role="status">
              <span aria-hidden="true">★</span>
              <strong>CMLL gennemført</strong>
              <p>{completionMessage}</p>
              <button type="button" className="button primary" onClick={restart}>
                Træn én gang til
              </button>
            </div>
          ) : mode === 'live' ? (
            <div className="live-coach-message" role="status">
              <span className="live-dot" aria-hidden="true" />
              <strong>GoCube vurderer næste kig</strong>
              <p>{liveCoach}</p>
            </div>
          ) : mode === 'manual' ? (
            <div className="live-coach-message">
              <strong>Træn uden aflæsning</strong>
              <p>
                Bekræft først, når begge blokke er intakte, alle fire hvide hjørner vender op, og
                sidefarverne matcher centrene.
              </p>
              <button
                type="button"
                className="button primary"
                onClick={() => void finishAttempt(false)}
              >
                Mine fire hjørner er løst
              </button>
            </div>
          ) : (
            <div className="first-block-start">
              {isLiveReady ? (
                !progress.blocksComplete ? (
                  <>
                    <p>Begge blokke skal være færdige før CMLL.</p>
                    <Link className="button secondary" to="/fag/roux/second-block">
                      Åbn Second Block
                    </Link>
                  </>
                ) : progress.complete ? (
                  <p>
                    CMLL er allerede løst. Udfør den valgte opstilling ovenfor; derefter bliver
                    startknappen klar.
                  </p>
                ) : (
                  <button type="button" className="button primary" onClick={() => start('live')}>
                    Start CMLL med GoCube
                  </button>
                )
              ) : (
                <>
                  <p>
                    Forbind GoCube for automatisk kontrol, eller øv med din egen visuelle kontrol.
                  </p>
                  <Link className="button secondary" to="/fag/roux/diagnostik">
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
            <summary>Vis mine to algoritmer</summary>
            <ol>
              <li>
                <b>Sune:</b> {displayAlg(SUNE)}
              </li>
              <li>
                <b>T-perm:</b> {displayAlg(T_PERM)}
              </li>
              <li>U, U′ og U2 er opstillingstræk, ikke nye algoritmer.</li>
            </ol>
          </details>
        </aside>
      </div>
    </section>
  );
}

export function RouxCmllPage({
  cubeAdapter = physicalCubeAdapter,
}: {
  cubeAdapter?: SmartCubeAdapter;
}) {
  const revealPractice = () =>
    window.setTimeout(
      () =>
        document
          .getElementById('cmll-practice')
          ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }),
      0
    );
  return (
    <div className="page roux-first-block-page roux-cmll-page">
      <header className="subject-hero ice first-block-hero cmll-hero">
        <div>
          <p className="eyebrow">Roux · etape 3 af 4</p>
          <h1>Begynder-CMLL</h1>
          <p>Løs alle fire tophjørner i to kig med præcis to algoritmer.</p>
          <div className="first-block-hero-meta">
            <span>Hvid top</span>
            <span>2 kig</span>
            <span>2 algoritmer</span>
            <span>Live GoCube-kontrol</span>
          </div>
        </div>
        <div className="cmll-hero-target">
          <CmllTop oriented />
          <div>
            <span>Fasens mål</span>
            <strong>Fire løste hjørner</strong>
            <p>Begge blokke bevares; kanterne venter til LSE.</p>
          </div>
        </div>
      </header>
      <nav className="lesson-breadcrumb" aria-label="Roux-navigation">
        <Link to="/fag/roux">Roux</Link>
        <span>→</span>
        <Link to="/fag/roux/second-block">Second Block</Link>
        <span>→</span>
        <strong>CMLL</strong>
      </nav>
      <CmllLesson onFinish={revealPractice} />
      <CmllPractice adapter={cubeAdapter} />
      <section className="lesson-card algorithm-ladder cmll-ladder">
        <div>
          <p className="eyebrow">Algoritmestigen</p>
          <h2>To-look nu · direkte CMLL langt senere</h2>
          <p>
            Den langsommere løsning bliver altid stående som fallback, selv når en genvej låses op.
          </p>
        </div>
        <ol>
          <li className="unlocked">
            <b>Nu</b>
            <span>
              <strong>To-look CMLL</strong>
              <small>Sune + T-perm · 2 algoritmer</small>
            </span>
          </li>
          <li>
            <b>Senere</b>
            <span>
              <strong>Udvalgte direkte tilfælde</strong>
              <small>kun når målinger viser reel gevinst</small>
            </span>
          </li>
          <li>
            <b>Avanceret</b>
            <span>
              <strong>Fuld CMLL</strong>
              <small>42 tilfælde · ikke et begyndermål</small>
            </span>
          </li>
        </ol>
      </section>
      <p className="curriculum-source">
        Metodegrundlag:{' '}
        <a href="https://tutorial.rouxers.com/beginners/cmll.html" target="_blank" rel="noreferrer">
          Rouxers’ begyndervejledning til CMLL
        </a>
        . Farverne er tilpasset PeterLingos faste hvid-op, gul-ned-greb.
      </p>
      <div className="button-row page-footer-actions">
        <Link className="button primary" to="/fag/roux/lse">
          Fortsæt til Last Six Edges
        </Link>
        <Link className="button secondary" to="/fag/roux/second-block">
          Tilbage til Second Block
        </Link>
        <Link className="button secondary" to="/fag/roux/notation">
          Slå notation op
        </Link>
        <Link className="button secondary" to="/fag/roux">
          Roux-oversigt
        </Link>
      </div>
    </div>
  );
}
