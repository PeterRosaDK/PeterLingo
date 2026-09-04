import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { physicalCubeAdapter } from '../../hardware/smartcube/physicalCube';
import type { ConnectionState, CubeState, RememberedCube } from '../../hardware/smartcube/types';
import { validateFacelets } from './faceletSolver';

type RememberedCheck = 'checking' | 'ready' | 'unsupported' | 'error';

const connectionLabel: Record<ConnectionState, string> = {
  unsupported: 'Bluetooth er ikke tilgængelig',
  disconnected: 'Ikke forbundet',
  connecting: 'Forbinder …',
  connected: 'GoCube er forbundet',
  error: 'Forbindelsen mislykkedes',
};

function connectionErrorMessage(error: unknown, remembered: boolean): string {
  if (!(error instanceof Error)) return 'Bluetooth-forbindelsen mislykkedes.';
  if (error.name === 'NotFoundError') {
    return remembered
      ? 'Browseren fandt den huskede cube, men kunne ikke kontakte den. Drej et lag for at vække den.'
      : 'Bluetooth-vælgeren blev lukket uden en cube.';
  }
  if (error.name === 'NetworkError') {
    return 'Væk cuben, og luk andre apps eller faner, der kan være forbundet til den.';
  }
  if (error.name === 'SecurityError') {
    return 'Browseren kræver, at du trykker på forbindelsesknappen igen.';
  }
  return error.message;
}

function pickerStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'Select your cube…': 'Vælg din GoCube i browserens Bluetooth-vindue …',
    'Reading advertisements…': 'GoCube er valgt. Læser dens Bluetooth-oplysninger …',
    'Connecting…': 'GoCube er fundet. Opretter forbindelsen …',
    'Verifying connection…': 'Kontrollerer forbindelsen …',
  };
  return messages[status] ?? status;
}

export function SmartCubeDiagnosticsPage() {
  const adapter = physicalCubeAdapter;
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [state, setState] = useState<CubeState | null>(() => adapter.getCubeState());
  const [rememberedCubes, setRememberedCubes] = useState<RememberedCube[]>([]);
  const [rememberedCheck, setRememberedCheck] = useState<RememberedCheck>('checking');
  const [message, setMessage] = useState(
    adapter.getConnectionState() === 'connected'
      ? 'Den eksisterende forbindelse er klar.'
      : 'Tænd cuben. Hvis browseren kender den, forsøger PeterLingo allerede at genforbinde.'
  );
  const liveFacelets = state?.facelets ?? null;
  const liveStateIsSolvable = Boolean(liveFacelets && validateFacelets(liveFacelets).ok);
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
    const offState = adapter.subscribeToState?.((nextState) => {
      setState(nextState);
      setConnection(adapter.getConnectionState());
    });
    const rememberedTimer = window.setTimeout(() => void refreshRememberedCubes(), 0);
    return () => {
      window.clearTimeout(rememberedTimer);
      offState?.();
    };
  }, [adapter, refreshRememberedCubes]);

  const completeConnection = async () => {
    setConnection(adapter.getConnectionState());
    setState(adapter.getCubeState());
    await refreshRememberedCubes();
    setMessage('GoCube er klar. Gå tilbage til Roux for at kalibrere eller begynde træningen.');
  };

  const connect = () => {
    setConnection('connecting');
    setMessage('Åbner browserens Bluetooth-vindue …');
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
    setMessage(`Forsøger at kontakte ${device.name} uden en ny Bluetooth-søgning …`);
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
      setMessage('Forbindelsen er lukket.');
    });
  };

  const memoryExplanation =
    rememberedCheck === 'checking'
      ? 'Kontrollerer, om browseren har gemt Bluetooth-tilladelsen …'
      : rememberedCheck === 'unsupported'
        ? 'Denne browser kan ikke genåbne en Bluetooth-enhed efter en ny sideindlæsning. På iPhone og iPad kræver Beacio derfor et nyt tryk på forbindelsesknappen.'
        : rememberedCheck === 'error'
          ? 'Browserens gemte Bluetooth-tilladelser kunne ikke læses.'
          : rememberedCubes.length
            ? 'Browseren husker cuben. Den skal stadig være vågen og må ikke være optaget af en anden app.'
            : 'Browseren har endnu ikke givet PeterLingo en genbrugelig Bluetooth-tilladelse.';

  return (
    <div className="page diagnostics-page simple-cube-setup">
      <header className="page-heading">
        <p className="eyebrow">Roux</p>
        <h1>Opsætning</h1>
        <p>Her kan du vælge en GoCube eller få en blandet cube løst. Resten foregår i træningen.</p>
      </header>

      <section className="setup-simple-grid">
        <article className="setup-simple-card">
          <p className="eyebrow">GoCube</p>
          <div className="setup-simple-status">
            <i className={connection === 'connected' ? 'connected' : ''} aria-hidden="true" />
            <h2>{connectionLabel[connection]}</h2>
          </div>
          <p className="connection-message" role="status">
            {message}
          </p>
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
                  disabled={connection === 'connecting' || !adapter.isSupported()}
                >
                  {rememberedCubes.length ? 'Vælg en anden cube' : 'Find GoCube'}
                </button>
              </>
            )}
          </div>
          <p className="setup-memory-note">{memoryExplanation}</p>
        </article>

        <article className="setup-simple-card setup-solve-card">
          <p className="eyebrow">Hurtig hjælp</p>
          <h2>Løs en blandet cube</h2>
          <p>
            Når GoCube har sendt en gyldig tilstand, kan PeterLingo føre dig tilbage til løst ét
            træk ad gangen.
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
            <Link
              className="button secondary"
              to="/fag/roux/manuel-tilstand"
              state={{ facelets: state?.facelets ?? null }}
            >
              Indtast farver manuelt
            </Link>
          </div>
          <p className="setup-memory-note">
            {connection !== 'connected'
              ? 'Forbind cuben først, eller indtast farverne manuelt.'
              : liveStateIsSolvable
                ? 'Cubens aktuelle tilstand er klar.'
                : 'Venter på en fuld, gyldig tilstand fra cuben.'}
          </p>
        </article>
      </section>

      <div className="button-row page-footer-actions">
        <Link className="button primary" to="/fag/roux">
          Til Roux-træning
        </Link>
        <Link className="button secondary" to="/fag/roux/notation">
          Hjælp til notation
        </Link>
      </div>
    </div>
  );
}
