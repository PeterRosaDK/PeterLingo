import { useEffect, useState } from 'react';
import { physicalCubeAdapter, reconnectApprovedCube } from '../../hardware/smartcube/physicalCube';
import type {
  ConnectionState,
  CubeOrientation,
  CubeState,
  SmartCubeAdapter,
} from '../../hardware/smartcube/types';
import { validateFacelets } from './faceletSolver';
import { LivePhysicalCubeViewer } from './LivePhysicalCubeViewer';

const connectionLabel: Record<ConnectionState, string> = {
  unsupported: 'Bluetooth er ikke tilgængelig her',
  disconnected: 'GoCube er ikke forbundet',
  connecting: 'Forsøger at forbinde …',
  connected: 'GoCube følger med',
  error: 'GoCube kunne ikke nås',
};

function connectionErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Bluetooth-forbindelsen mislykkedes.';
  if (error.name === 'NotFoundError') return 'Bluetooth-vinduet blev lukket uden en cube.';
  if (error.name === 'NetworkError') {
    return 'Væk cuben, og luk andre apps eller faner, som kan være forbundet til den.';
  }
  if (error.name === 'SecurityError') return 'Browseren kræver et nyt tryk på Tilslut.';
  return error.message;
}

function pickerStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    'Select your cube…': 'Vælg din cube i browserens Bluetooth-vindue …',
    'Reading advertisements…': 'Cuben er valgt. Læser dens Bluetooth-oplysninger …',
    'Connecting…': 'Cuben er fundet. Opretter forbindelsen …',
    'Verifying connection…': 'Kontrollerer forbindelsen …',
  };
  return messages[status] ?? status;
}

export function RouxStartCube({
  adapter = physicalCubeAdapter,
  onQuickSolve,
}: {
  adapter?: SmartCubeAdapter;
  onQuickSolve?(): void;
}) {
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [cubeState, setCubeState] = useState<CubeState | null>(() => adapter.getCubeState());
  const [orientation, setOrientation] = useState<CubeOrientation | null>(
    () => adapter.getOrientation?.() ?? null
  );
  const [orientationReference, setOrientationReference] = useState<
    CubeOrientation | null | undefined
  >(undefined);
  const [message, setMessage] = useState('');
  const [busyAction, setBusyAction] = useState<'connect' | 'read' | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = (nextState?: CubeState | null) => {
      if (!active) return;
      const nextConnection = adapter.getConnectionState();
      setConnection(nextConnection);
      setCubeState(nextState === undefined ? adapter.getCubeState() : nextState);
      if (nextConnection !== 'connected') setOrientation(null);
    };
    const offState = adapter.subscribeToState?.((nextState) => refresh(nextState));
    const offOrientation = adapter.subscribeToOrientation?.((nextOrientation) => {
      if (!active) return;
      setOrientation(nextOrientation);
      refresh();
    });

    const reconnect = async () => {
      if (!adapter.isSupported()) {
        setConnection('unsupported');
        return;
      }
      if (adapter.getConnectionState() === 'connected') {
        refresh();
        return;
      }
      setMessage('Leder efter en cube, som browseren allerede kender …');
      let connected = await reconnectApprovedCube(adapter);
      if (!connected && active && adapter.getConnectionState() !== 'connected') {
        connected = await reconnectApprovedCube(adapter, { retry: true });
      }
      if (!active) return;
      refresh();
      setMessage(
        connected
          ? 'Forbindelsen blev genetableret automatisk.'
          : 'Tænd eller bevæg cuben. Tryk Tilslut, hvis den ikke vågner automatisk.'
      );
    };

    const retryWhenVisible = () => {
      if (document.visibilityState === 'visible' && adapter.getConnectionState() !== 'connected') {
        void reconnect();
      }
    };

    void reconnect();
    window.addEventListener('focus', retryWhenVisible);
    document.addEventListener('visibilitychange', retryWhenVisible);
    return () => {
      active = false;
      window.removeEventListener('focus', retryWhenVisible);
      document.removeEventListener('visibilitychange', retryWhenVisible);
      offState?.();
      offOrientation?.();
    };
  }, [adapter]);

  const connect = async () => {
    if (busyAction || connection === 'connecting') return;
    setBusyAction('connect');
    setConnection('connecting');
    setMessage('Leder først efter en allerede godkendt cube …');
    try {
      const remembered = await adapter.getRememberedCubes?.();
      if (remembered?.length === 1 && adapter.connectRemembered) {
        setMessage(`Forbinder direkte til ${remembered[0]!.name} …`);
        await adapter.connectRemembered(remembered[0]!.id, (status) => setMessage(status));
      } else {
        setMessage('Åbner browserens Bluetooth-vindue …');
        await adapter.connect((status) => setMessage(pickerStatusMessage(status)));
      }
      setConnection(adapter.getConnectionState());
      setCubeState(adapter.getCubeState());
      setMessage('GoCube er klar. Du kan begynde med det samme.');
    } catch (error) {
      setConnection(adapter.getConnectionState());
      setMessage(connectionErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  };

  const calibrateViewer = () => {
    const currentOrientation = adapter.getOrientation?.() ?? orientation;
    if (connection !== 'connected' || !currentOrientation) return;
    setOrientationReference(currentOrientation);
    setMessage('3D-cuben er rettet ind efter den måde, du holder den på. Cubens farver er urørte.');
  };

  const rereadCube = async () => {
    if (!adapter.requestState || connection !== 'connected' || busyAction) return;
    setBusyAction('read');
    setMessage('Beder GoCube om en frisk aflæsning …');
    try {
      await adapter.requestState();
      setCubeState(adapter.getCubeState());
      setMessage('Cubens fulde tilstand er læst igen.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cuben kunne ikke læses igen.');
    } finally {
      setBusyAction(null);
      setConnection(adapter.getConnectionState());
    }
  };

  const canCalibrate = connection === 'connected' && Boolean(orientation);
  const canReread = connection === 'connected' && Boolean(adapter.requestState);
  const canQuickSolve =
    connection === 'connected' &&
    cubeState?.synchronization === 'synchronized' &&
    Boolean(cubeState.facelets && validateFacelets(cubeState.facelets).ok);

  return (
    <section className="roux-start-cube" aria-label="Live GoCube">
      <div className="roux-start-viewer">
        <div className="cube-hold-guide cube-hold-guide-top" aria-hidden="true">
          <b>HVID / GO</b>
          <span>↑ op</span>
        </div>
        <LivePhysicalCubeViewer adapter={adapter} orientationReference={orientationReference} />
        <div className="cube-hold-guide cube-hold-guide-front" aria-hidden="true">
          <i />
          <span>Grøn side mod dig</span>
        </div>
      </div>
      <div className="roux-start-cube-controls">
        <div className={`cube-connection-state ${connection === 'connected' ? 'connected' : ''}`}>
          <i aria-hidden="true" />
          <span>{connectionLabel[connection]}</span>
        </div>
        <p className="roux-start-cube-message" aria-live="polite">
          {connection === 'connected' && !orientation
            ? message ||
              'Farverne er live. Bevæg cuben lidt, hvis 3D-retningen også skal følge med.'
            : message}
        </p>
        <div className="roux-cube-primary-actions">
          {connection !== 'connected' && (
            <button
              type="button"
              className="button primary"
              disabled={busyAction === 'connect' || !adapter.isSupported()}
              onClick={() => void connect()}
            >
              {busyAction === 'connect' ? 'Tilslutter …' : 'Tilslut'}
            </button>
          )}
          <button
            type="button"
            className="button secondary"
            disabled={!canCalibrate}
            onClick={calibrateViewer}
          >
            Kalibrer 3D
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!canReread || busyAction === 'read'}
            onClick={() => void rereadCube()}
          >
            {busyAction === 'read' ? 'Læser …' : 'Læs cuben igen'}
          </button>
          <button
            type="button"
            className="button solve"
            disabled={!canQuickSolve}
            onClick={onQuickSolve}
          >
            Løs hurtigt
          </button>
        </div>
        <small>Kalibrer 3D ændrer kun visningen. “Læs cuben igen” henter farverne på ny.</small>
      </div>
    </section>
  );
}
