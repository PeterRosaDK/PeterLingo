import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { WebBluetoothSmartCubeAdapter } from '../../hardware/smartcube/WebBluetoothSmartCubeAdapter';
import { detectBluetoothEnvironment } from '../../hardware/smartcube/environment';
import type {
  ConnectionState,
  CubeMove,
  CubeState,
  SmartCubeAdapter,
} from '../../hardware/smartcube/types';
import { CubeFaceletNet } from './CubeFaceletNet';
import { GoCubeMoveCapture } from './GoCubeMoveCapture';

// Keep the approved connection alive while the user moves between PeterLingo routes.
// A full page reload still follows the browser's Web Bluetooth permission model.
const physicalCubeAdapter: SmartCubeAdapter = new WebBluetoothSmartCubeAdapter();

export function SmartCubeDiagnosticsPage() {
  const environment = useMemo(() => detectBluetoothEnvironment(), []);
  const adapter = physicalCubeAdapter;
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [state, setState] = useState<CubeState | null>(() => adapter.getCubeState());
  const [history, setHistory] = useState<CubeMove[]>([]);
  const [battery, setBattery] = useState<number | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [message, setMessage] = useState(() =>
    adapter.getConnectionState() === 'connected'
      ? 'Den eksisterende GoCube-forbindelse i PeterLingo er genbrugt.'
      : environment.guidance
  );

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
    return () => {
      offMove();
      offState?.();
    };
  }, [adapter]);

  // This handler deliberately calls connect() immediately. requestDevice remains in this user gesture.
  const connect = () => {
    setConnection('connecting');
    setMessage('Vælg din GoCube i browserens enhedsvælger …');
    adapter
      .connect()
      .then(async () => {
        setConnection(adapter.getConnectionState());
        setState(adapter.getCubeState());
        setBattery((await adapter.getBatteryLevel?.()) ?? null);
        setMessage(
          'Forbindelsen er oprettet. Hold den hvide GO-side mod dig med logoet opret, og sammenlign farvenettet.'
        );
      })
      .catch((error: unknown) => {
        setConnection(adapter.getConnectionState());
        setMessage(error instanceof Error ? error.message : 'Forbindelsen mislykkedes.');
      });
  };

  const disconnect = () => {
    void adapter.disconnect().then(() => {
      setConnection('disconnected');
      setMessage('Forbindelsen er lukket.');
    });
  };

  const readPhysicalState = async () => {
    setActionPending(true);
    setMessage('Beder GoCube om en ny, fuld farveaflæsning …');
    try {
      await adapter.requestState?.();
      setState(adapter.getCubeState());
      setMessage(
        'Ny aflæsning er bestilt. Sammenlign farvenettet med den fysiske terning; handlingen ændrer ikke terningens referencepunkt.'
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
        ⚠ Fysisk forbindelse bekræftet · farvetilstand og træksynkronisering verificeres nu
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
          </dl>
          <div className="button-row">
            {connection !== 'connected' ? (
              <button type="button" className="button primary" onClick={connect}>
                Forbind GoCube
              </button>
            ) : (
              <>
                <button type="button" className="button secondary" onClick={disconnect}>
                  Afbryd
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => void readPhysicalState()}
                  disabled={actionPending}
                >
                  Læs cuben igen
                </button>
              </>
            )}
          </div>
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
            Ved forbindelse og “Læs cuben igen” kommer en fuld 54-felters tilstand fra hardwaren.
            Mellem de fulde aflæsninger sender cuben sine træk, og biblioteket fører nettet frem.
            Det er mere pålideligt end en 3D-terning, der altid antager en løst startstilling.
          </p>
          <Link
            className="button secondary"
            to="/fag/roux/manuel-tilstand"
            state={{ facelets: state?.facelets ?? null }}
          >
            Indtast den fysiske tilstand manuelt
          </Link>
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
