import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { detectBluetoothEnvironment } from '../../hardware/smartcube/environment';
import { physicalCubeAdapter } from '../../hardware/smartcube/physicalCube';
import type {
  ConnectionState,
  CubeMove,
  CubeOrientation,
  CubeState,
  RememberedCube,
} from '../../hardware/smartcube/types';
import { CubeFaceletNet } from './CubeFaceletNet';
import { CubeViewer } from './CubeViewer';
import { solveFacelets, validateFacelets } from './faceletSolver';

type RememberedCheck = 'checking' | 'ready' | 'unsupported' | 'error';

function connectionErrorMessage(error: unknown, remembered: boolean): string {
  if (!(error instanceof Error)) return 'Bluetooth-forbindelsen mislykkedes.';
  if (error.name === 'NotFoundError') {
    return remembered
      ? 'Browseren husker cuben, men kunne ikke kontakte den. Drej et lag for at vække den, og prøv igen.'
      : 'Bluetooth-vælgeren blev lukket uden en cube. Drej et lag for at vække GoCube, og søg igen.';
  }
  if (error.name === 'NetworkError') {
    return remembered
      ? 'GoCube blev genkendt, men selve forbindelsen mislykkedes. Væk cuben, og luk andre apps eller faner, der kan være forbundet til den.'
      : 'GoCube blev valgt, men selve forbindelsen mislykkedes. Væk cuben, og luk andre apps eller faner, der kan være forbundet til den.';
  }
  if (error.name === 'SecurityError') {
    return 'Browseren blokerede Bluetooth-adgangen. Kontrollér sidens Bluetooth-tilladelse ved adresselinjen.';
  }
  return error.message;
}

function pickerStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'Select your cube…': 'Browserens Bluetooth-vælger er åben. Vælg din GoCube …',
    'Reading advertisements…': 'GoCube er valgt. Læser dens Bluetooth-oplysninger …',
    'Connecting…': 'GoCube er fundet. Opretter selve forbindelsen …',
    'Verifying connection…': 'Forbindelsen er oprettet. Kontrollerer data fra cuben …',
  };
  return messages[status] ?? status;
}

export function SmartCubeDiagnosticsPage() {
  const environment = useMemo(() => detectBluetoothEnvironment(), []);
  const adapter = physicalCubeAdapter;
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [state, setState] = useState<CubeState | null>(() => adapter.getCubeState());
  const [history, setHistory] = useState<CubeMove[]>([]);
  const [orientation, setOrientation] = useState<CubeOrientation | null>(
    () => adapter.getOrientation?.() ?? null
  );
  const [orientationReference, setOrientationReference] = useState<CubeOrientation | null>(null);
  const [viewerSolution, setViewerSolution] = useState('');
  const [viewerStatus, setViewerStatus] = useState('Venter på cubens tilstand');
  const [battery, setBattery] = useState<number | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [rememberedCubes, setRememberedCubes] = useState<RememberedCube[]>([]);
  const [rememberedCheck, setRememberedCheck] = useState<RememberedCheck>('checking');
  const [bluetoothAvailable, setBluetoothAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState(() =>
    adapter.getConnectionState() === 'connected'
      ? 'Den eksisterende GoCube-forbindelse i PeterLingo er genbrugt.'
      : environment.guidance
  );
  const liveFacelets = state?.facelets ?? null;
  const liveStateIsSolvable = liveFacelets ? validateFacelets(liveFacelets).ok : false;
  const canSolveLiveState =
    connection === 'connected' && state?.synchronization === 'synchronized' && liveStateIsSolvable;
  const liveSolveSearch = liveFacelets
    ? `?${new URLSearchParams({ facelets: liveFacelets, solve: '1' }).toString()}`
    : '';

  useEffect(() => {
    let cancelled = false;
    let timeout = 0;
    if (!liveFacelets || !validateFacelets(liveFacelets).ok) {
      setViewerSolution('');
      setViewerStatus('Forbind cuben for at se dens aktuelle farver i 3D');
      return;
    }
    setViewerStatus('Opdaterer 3D-visningen …');
    timeout = window.setTimeout(() => {
      void solveFacelets(liveFacelets)
        .then((solution) => {
          if (cancelled) return;
          setViewerSolution(solution.algorithm);
          setViewerStatus('3D-farverne følger cubens aflæste tilstand');
        })
        .catch(() => {
          if (cancelled) return;
          setViewerSolution('');
          setViewerStatus('3D-visningen kunne ikke beregnes fra den aktuelle tilstand');
        });
    }, 140);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [liveFacelets]);

  const refreshRememberedCubes = useCallback(async () => {
    if (!adapter.getRememberedCubes) {
      setRememberedCheck('unsupported');
      return;
    }
    try {
      const devices = await adapter.getRememberedCubes();
      if (devices === null) {
        setRememberedCheck('unsupported');
        return;
      }
      setRememberedCubes(devices);
      setRememberedCheck('ready');
    } catch {
      setRememberedCheck('error');
    }
  }, [adapter]);

  useEffect(() => {
    const offMove = adapter.subscribeToMoves((move) => {
      setHistory((current) => [...current, move]);
      setState(adapter.getCubeState());
    });
    const offState = adapter.subscribeToState?.((nextState) => {
      setState(nextState);
      const nextConnection = adapter.getConnectionState();
      setConnection(nextConnection);
      if (nextConnection !== 'connected') {
        setOrientation(null);
        setOrientationReference(null);
      }
    });
    const offOrientation = adapter.subscribeToOrientation?.((nextOrientation) => {
      setOrientation(nextOrientation);
    });
    if (adapter.getConnectionState() === 'connected') {
      void adapter.getBatteryLevel?.().then((level) => setBattery(level ?? null));
    }
    void refreshRememberedCubes();
    void adapter
      .getBluetoothAvailability?.()
      .then((available) => setBluetoothAvailable(available ?? null))
      .catch(() => setBluetoothAvailable(null));
    return () => {
      offMove();
      offState?.();
      offOrientation?.();
    };
  }, [adapter, refreshRememberedCubes]);

  // This handler deliberately calls connect() immediately. requestDevice remains in this user gesture.
  const completeConnection = async () => {
    setConnection(adapter.getConnectionState());
    setState(adapter.getCubeState());
    setBattery((await adapter.getBatteryLevel?.()) ?? null);
    await refreshRememberedCubes();
    setMessage(
      'Forbindelsen er oprettet. Hold den hvide GO-side opad og den grønne side mod dig, og sammenlign farvenettet.'
    );
  };

  const connect = () => {
    setConnection('connecting');
    setMessage('Åbner browserens Bluetooth-vælger …');
    adapter
      .connect((status) => setMessage(pickerStatusMessage(status)))
      .then(completeConnection)
      .catch((error: unknown) => {
        setConnection(adapter.getConnectionState());
        setMessage(connectionErrorMessage(error, false));
      });
  };

  const reconnect = (device: RememberedCube) => {
    if (!adapter.connectRemembered) return;
    setConnection('connecting');
    setMessage(`Browseren husker ${device.name}. Forsøger at genforbinde uden ny søgning …`);
    adapter
      .connectRemembered(device.id, (status) => setMessage(status))
      .then(completeConnection)
      .catch((error: unknown) => {
        setConnection(adapter.getConnectionState());
        setMessage(connectionErrorMessage(error, true));
        void refreshRememberedCubes();
      });
  };

  const disconnect = () => {
    void adapter.disconnect().then(() => {
      setConnection('disconnected');
      setBattery(null);
      setOrientation(null);
      setOrientationReference(null);
      setMessage('Forbindelsen er lukket. Browserens tilladelse til cuben er bevaret.');
    });
  };

  const readPhysicalState = async () => {
    setActionPending(true);
    setMessage('Kontrollerer den løbende tilstand mod GoCube …');
    try {
      await adapter.requestState?.();
      setState(adapter.getCubeState());
      setMessage(
        'Synkroniseringskontrollen er bestilt. Handlingen ændrer ikke GoCubens referencepunkt.'
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Tilstanden kunne ikke genindlæses.');
    } finally {
      setActionPending(false);
    }
  };

  const clearTracking = () => {
    adapter.clearTracking?.();
    setState(adapter.getCubeState());
    setHistory([]);
    setMessage('Den lokale trækhistorik er ryddet. GoCubens fysiske reference er ikke ændret.');
  };

  const calibrateSolvedState = async () => {
    const physicallySolved = window.confirm(
      'Brug kun denne nulstilling, når alle seks fysiske sider er ensfarvede. GoCube får besked på at regne den aktuelle fysiske stilling som løst. Er terningen fysisk løst nu?'
    );
    if (!physicallySolved) return;
    setActionPending(true);
    setMessage('Kalibrerer GoCubens nuværende fysiske stilling som løst …');
    try {
      await adapter.calibrateSolvedState?.();
      setState(adapter.getCubeState());
      setHistory([]);
      setMessage('GoCube er nulstillet til den fysisk løste stilling. Drej én side som kontrol.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'GoCube kunne ikke nulstilles.');
    } finally {
      setActionPending(false);
    }
  };
  return (
    <div className="page diagnostics-page">
      <header className="page-heading">
        <p className="eyebrow">Roux · opsætning</p>
        <h1>Opsætning</h1>
        <p>Forbind GoCube, se hvad den aflæser, eller få cuben løst hurtigt.</p>
        <Link className="button secondary" to="/fag/roux/traening">
          Gå direkte til Træning
        </Link>
      </header>
      <section className="cube-reference-grip" aria-labelledby="reference-grip-title">
        <div>
          <p className="eyebrow">Fælles nulpunkt</p>
          <h2 id="reference-grip-title">Hvid GO-side op · grøn side mod dig</h2>
        </div>
        <p>
          Dette er standardgrebet: F er grøn foran, B er blå bagpå, R er rød til højre, L er orange
          til venstre, U er hvid ovenpå, og D er gul nedenunder. Behold grebet under målingen.
        </p>
        <Link className="button secondary" to="/fag/roux/notation">
          Hvad betyder R, R′ og M?
        </Link>
      </section>
      <section className="diagnostic-grid setup-grid">
        <div className="diagnostic-panel setup-technical-panel">
          <h2>Miljø</h2>
          <dl>
            <div>
              <dt>Browser</dt>
              <dd>{environment.browser}</dd>
            </div>
            <div>
              <dt>Platform</dt>
              <dd>{environment.platform}</dd>
            </div>
            <div>
              <dt>Sikker kontekst</dt>
              <dd>{environment.secureContext ? 'Ja' : 'Nej'}</dd>
            </div>
            <div>
              <dt>Web Bluetooth</dt>
              <dd>{environment.webBluetooth ? 'Tilgængelig' : 'Ikke fundet'}</dd>
            </div>
            <div>
              <dt>Bluetooth-adapter</dt>
              <dd>
                {bluetoothAvailable === null
                  ? 'Kan ikke afgøres'
                  : bluetoothAvailable
                    ? 'Rapporteret tilgængelig'
                    : 'Rapporteret utilgængelig'}
              </dd>
            </div>
            <div>
              <dt>Beacio</dt>
              <dd>
                {environment.beacio === 'active'
                  ? 'Aktiv/polyfill fundet'
                  : environment.beacio === 'not-needed'
                    ? 'Ikke nødvendig'
                    : 'Mangler eller er slået fra'}
              </dd>
            </div>
          </dl>
          <p className="guidance">{environment.guidance}</p>
          {environment.webBluetooth && (
            <p className="guidance">
              “Rapporteret tilgængelig” betyder kun, at browseren kan bruge en Bluetooth-adapter;
              det beviser ikke, at GoCube er tændt eller kan nås.
            </p>
          )}
        </div>
        <div className="diagnostic-panel setup-connection-panel">
          <p className="eyebrow">1 · Forbind</p>
          <h2>GoCube</h2>
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{connection}</dd>
            </div>
            <div>
              <dt>Enhed</dt>
              <dd>{adapter.getDeviceName?.() ?? '—'}</dd>
            </div>
            <div>
              <dt>Protokol</dt>
              <dd>{adapter.getProtocolName?.() ?? '—'}</dd>
            </div>
            <div>
              <dt>Batteri</dt>
              <dd>{battery === null ? '—' : `${battery}%`}</dd>
            </div>
            <div>
              <dt>Sidste træk</dt>
              <dd>{history.at(-1) ? `${history.at(-1)?.notation} · rå GoCube-kode` : '—'}</dd>
            </div>
            <div>
              <dt>Husket af browseren</dt>
              <dd>
                {rememberedCheck === 'checking'
                  ? 'Kontrollerer …'
                  : rememberedCheck === 'unsupported'
                    ? 'Kan ikke aflæses i denne browser'
                    : rememberedCheck === 'error'
                      ? 'Kontrollen mislykkedes'
                      : rememberedCubes.length
                        ? rememberedCubes.map((device) => device.name).join(', ')
                        : 'Ingen GoCube-tilladelse fundet'}
              </dd>
            </div>
          </dl>
          <div className="button-row">
            {connection === 'connected' ? (
              <button type="button" className="button secondary" onClick={disconnect}>
                Afbryd
              </button>
            ) : (
              <>
                {rememberedCubes.map((device) => (
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => reconnect(device)}
                    disabled={connection === 'connecting'}
                    key={device.id}
                  >
                    Genforbind {device.name}
                  </button>
                ))}
                <button
                  type="button"
                  className={rememberedCubes.length ? 'button secondary' : 'button primary'}
                  onClick={connect}
                  disabled={connection === 'connecting'}
                >
                  {rememberedCubes.length ? 'Vælg en anden cube …' : 'Find og forbind GoCube'}
                </button>
              </>
            )}
          </div>
          {rememberedCheck === 'ready' && rememberedCubes.length > 0 && (
            <p className="guidance">
              Browseren husker tilladelsen. Det beviser ikke, at cuben er vågen eller inden for
              rækkevidde; det afgør genforbindelsesforsøget.
            </p>
          )}
          <p className="connection-message" role="status">
            {message}
          </p>
        </div>
        <div className="diagnostic-panel cube-diagnostic setup-cube-panel">
          <p className="eyebrow">2 · Se og løs</p>
          <h2>Din cube i 3D</h2>
          <div className="live-cube-viewer">
            <CubeViewer
              algorithm={viewerSolution}
              showAlgorithmStart
              orientation={orientation}
              orientationReference={orientationReference}
            />
            <div>
              <span className={`status-pill ${liveStateIsSolvable ? 'good' : ''}`}>
                {state?.synchronization ?? 'unknown'}
              </span>
              <p>{viewerStatus}</p>
              <p>
                {orientation
                  ? orientationReference
                    ? 'Gyroskopet sender nu cubens retning til 3D-visningen.'
                    : 'Gyroskop fundet. Hold hvid/GO op og grøn frem, og sæt retningen.'
                  : 'Venter på orienteringsdata fra GoCube.'}
              </p>
              <button
                type="button"
                className="button secondary"
                disabled={!orientation}
                onClick={() => setOrientationReference(orientation)}
              >
                Sæt denne retning som hvid op · grøn frem
              </button>
            </div>
          </div>
          <p className="facelet-note">
            3D-cuben følger farverne løbende. Gyroretningen nulstilles kun for visningen og ændrer
            ikke GoCubens gemte cubetilstand.
          </p>
          <div className="button-row">
            {canSolveLiveState ? (
              <Link className="button primary" to={`/fag/roux/manuel-tilstand${liveSolveSearch}`}>
                Løs cuben hurtigt
              </Link>
            ) : (
              <button type="button" className="button primary" disabled>
                Løs cuben hurtigt
              </button>
            )}
            <button
              type="button"
              className="button secondary"
              onClick={() => void readPhysicalState()}
              disabled={connection !== 'connected' || actionPending}
              title={
                connection === 'connected'
                  ? 'Kontrollér den løbende tilstand mod GoCube'
                  : 'Forbind GoCube først'
              }
            >
              Kontrollér synkronisering
            </button>
            <Link
              className="button secondary"
              to="/fag/roux/manuel-tilstand"
              state={{ facelets: state?.facelets ?? null }}
            >
              Ret eller indtast farver manuelt
            </Link>
          </div>
          {connection === 'connected' && !liveStateIsSolvable && (
            <p className="facelet-note">
              Løsning aktiveres, når GoCube har leveret en fuld, fysisk gyldig tilstand.
            </p>
          )}
          {connection !== 'connected' && (
            <p className="facelet-note">
              Forbind GoCube ovenfor for at løse eller kontrollere den.
            </p>
          )}
          <details className="facelet-net-details">
            <summary>Vis udfoldet farvenet</summary>
            <CubeFaceletNet facelets={state?.facelets ?? null} />
          </details>
        </div>
        <div className="diagnostic-panel setup-technical-panel">
          <h2>Logisk state</h2>
          <dl>
            <div>
              <dt>Træk</dt>
              <dd>{state?.moveCount ?? 0}</dd>
            </div>
            <div>
              <dt>Facelets</dt>
              <dd className="facelets">{state?.facelets ?? 'Ikke rapporteret'}</dd>
            </div>
          </dl>
          {connection === 'connected' && (
            <div className="diagnostic-reset-actions">
              <button type="button" className="button secondary" onClick={clearTracking}>
                Ryd kun loggen
              </button>
              <button
                type="button"
                className="button danger"
                onClick={() => void calibrateSolvedState()}
                disabled={actionPending}
              >
                Nulstil efter fysisk løsning …
              </button>
            </div>
          )}
          {connection === 'connected' && (
            <p className="reset-guidance">
              Nulstilling løser ikke en blandet terning. Den må først bruges, når terningen fysisk
              er løst; ellers lærer elektronikken en forkert nulstilling.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
