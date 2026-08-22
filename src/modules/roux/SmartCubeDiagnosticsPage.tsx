import { useEffect, useMemo, useState } from 'react';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { WebBluetoothSmartCubeAdapter } from '../../hardware/smartcube/WebBluetoothSmartCubeAdapter';
import { detectBluetoothEnvironment } from '../../hardware/smartcube/environment';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import type {
  ConnectionState,
  CubeMove,
  CubeState,
  SmartCubeAdapter,
} from '../../hardware/smartcube/types';
import { CubeViewer } from './CubeViewer';

export function SmartCubeDiagnosticsPage() {
  const environment = useMemo(() => detectBluetoothEnvironment(), []);
  const [mode, setMode] = useState<'real' | 'mock'>('mock');
  const [adapter, setAdapter] = useState<SmartCubeAdapter>(() => new MockSmartCubeAdapter());
  const [connection, setConnection] = useState<ConnectionState>('disconnected');
  const [state, setState] = useState<CubeState | null>(() => ({
    facelets: SOLVED_FACELETS,
    algorithm: '',
    moveCount: 0,
    synchronization: 'synchronized',
  }));
  const [history, setHistory] = useState<CubeMove[]>([]);
  const [battery, setBattery] = useState<number | null>(null);
  const [message, setMessage] = useState(environment.guidance);

  useEffect(() => {
    const offMove = adapter.subscribeToMoves((move) => {
      setHistory((current) => [...current, move]);
      setState(adapter.getCubeState());
    });
    const offState = adapter.subscribeToState?.(setState);
    return () => {
      offMove();
      offState?.();
      void adapter.disconnect();
    };
  }, [adapter]);

  const changeMode = (next: 'real' | 'mock') => {
    void adapter.disconnect();
    const nextAdapter: SmartCubeAdapter =
      next === 'real' ? new WebBluetoothSmartCubeAdapter() : new MockSmartCubeAdapter();
    setAdapter(nextAdapter);
    setMode(next);
    setConnection('disconnected');
    setState(nextAdapter.getCubeState());
    setHistory([]);
    setBattery(null);
    setMessage(
      next === 'real'
        ? environment.guidance
        : 'Mock-tilstanden virker uden Bluetooth og ændrer ingen fysisk terning.'
    );
  };

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
          mode === 'real'
            ? 'Forbindelsen er oprettet i software. Drej nu en fysisk side og kontrollér loggen.'
            : 'Mock-terningen er klar.'
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
  const mock = adapter instanceof MockSmartCubeAdapter ? adapter : null;

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
        ⚠ Softwareimplementeret · fysisk GoCube endnu ikke verificeret
      </div>
      <div className="segmented">
        <button className={mode === 'mock' ? 'active' : ''} onClick={() => changeMode('mock')}>
          Mock-terning
        </button>
        <button className={mode === 'real' ? 'active' : ''} onClick={() => changeMode('real')}>
          Fysisk GoCube
        </button>
      </div>
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
                Forbind {mode === 'real' ? 'GoCube' : 'mock'}
              </button>
            ) : (
              <button type="button" className="button secondary" onClick={disconnect}>
                Afbryd
              </button>
            )}
          </div>
          <p className="connection-message" role="status">
            {message}
          </p>
        </div>
        <div className="diagnostic-panel cube-diagnostic">
          <h2>Visuel state</h2>
          <CubeViewer algorithm={state?.algorithm ?? ''} compact />
          <span
            className={`status-pill ${state?.synchronization === 'synchronized' ? 'good' : ''}`}
          >
            {state?.synchronization ?? 'unknown'}
          </span>
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
          {mock && connection === 'connected' && (
            <div className="move-pad mini">
              {['R', "R'", 'U', "U'", 'M', "M'"].map((move) => (
                <button type="button" key={move} onClick={() => mock.emitMove(move)}>
                  {move}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="move-history">
        <h2>Komplet trækhistorik</h2>
        <div>
          {history.length ? (
            history.map((move, index) => (
              <span key={`${move.timestamp}-${index}`}>
                {move.notation}
                <small>{new Date(move.timestamp).toLocaleTimeString('da-DK')}</small>
              </span>
            ))
          ) : (
            <p>Ingen træk registreret.</p>
          )}
        </div>
      </section>
    </div>
  );
}
