import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { detectBluetoothEnvironment } from '../../hardware/smartcube/environment';
import { physicalCubeAdapter } from '../../hardware/smartcube/physicalCube';
import type {
  ConnectionState,
  CubeMove,
  CubeState,
  RememberedCube,
} from '../../hardware/smartcube/types';
import { CubeFaceletNet } from './CubeFaceletNet';
import { validateFacelets } from './faceletSolver';
import { GoCubeMoveCapture } from './GoCubeMoveCapture';

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
      setConnection(adapter.getConnectionState());
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
    };
  }, [adapter, refreshRememberedCubes]);

  // This handler deliberately calls connect() immediately. requestDevice remains in this user gesture.
  const completeConnection = async () => {
    setConnection(adapter.getConnectionState());
    setState(adapter.getCubeState());
    setBattery((await adapter.getBatteryLevel?.()) ?? null);
    await refreshRememberedCubes();
    setMessage(
      'Forbindelsen er oprettet. Hold den hvide GO-side mod dig med logoet opret, og sammenlign farvenettet.'
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
        <p className="eyebrow">Roux · hardwarelaboratorium</p>
        <h1>GoCube-diagnostik</h1>
        <p>
          Intet her tæller som fysisk validering, før du selv har kørt checklisten på din terning.
        </p>
      </header>
      <div className="diagnostic-warning">
        ✓ Live-tracking af almindelige ydertræk bekræftet · M-træk verificeres som næste trin
      </div>
      <section className="cube-reference-grip" aria-labelledby="reference-grip-title">
        <div>
          <p className="eyebrow">Fælles nulpunkt</p>
          <h2 id="reference-grip-title">Hvid GO-side mod dig · logoet opret</h2>
        </div>
        <p>
          Brug dette greb, når vi sammenligner farver og navngiver M-træk. Den senere Roux-motor
          skal stadig kunne løse og undervise uafhængigt af farvevalg.
        </p>
        <Link className="button secondary" to="/fag/roux/notation">
          Hvad betyder R, R′ og M?
        </Link>
      </section>
      <section className="diagnostic-grid">
        <div className="diagnostic-panel">
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
        <div className="diagnostic-panel">
          <h2>Forbindelse</h2>
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
              <dd>{history.at(-1)?.notation ?? '—'}</dd>
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
        <div className="diagnostic-panel cube-diagnostic">
          <h2>Aflæst fysisk tilstand</h2>
          <CubeFaceletNet facelets={state?.facelets ?? null} />
          <span
            className={`status-pill ${state?.synchronization === 'synchronized' ? 'good' : ''}`}
          >
            {state?.synchronization ?? 'unknown'}
          </span>
          <p className="facelet-note">
            Farvenettet følger GoCube løbende under dine træk. Synkroniseringskontrollen nedenfor er
            kun en reserve ved genforbindelse, et mistet træk eller mistanke om en afvigelse.
          </p>
          <div className="button-row">
            {canSolveLiveState ? (
              <Link className="button primary" to={`/fag/roux/manuel-tilstand${liveSolveSearch}`}>
                Løs den aflæste cube
              </Link>
            ) : (
              <button type="button" className="button primary" disabled>
                Løs den aflæste cube
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
        </div>
        <div className="diagnostic-panel">
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
      <GoCubeMoveCapture
        connected={connection === 'connected'}
        history={history}
        onClear={clearTracking}
      />
      <section className="move-history">
        <h2>Rå trækhistorik</h2>
        <p className="move-history-note">
          Prøv ét M-træk fra referencegrebet. Hvis GoCube sender to ydertræk, viser +0 ms eller en
          meget lille afstand, at de hører sammen. Vi normaliserer først til M/M′, når retningen er
          fysisk bekræftet.
        </p>
        <div>
          {history.length ? (
            history.map((move, index) => {
              const previous = history[index - 1];
              const delta = previous
                ? Math.max(0, Math.round(move.timestamp - previous.timestamp))
                : null;
              return (
                <span key={`${move.timestamp}-${index}`}>
                  {move.notation}
                  <small>
                    {new Date(move.timestamp).toLocaleTimeString('da-DK')}
                    {delta === null ? '' : ` · +${delta} ms`}
                  </small>
                </span>
              );
            })
          ) : (
            <p>Ingen træk registreret.</p>
          )}
        </div>
      </section>
    </div>
  );
}
