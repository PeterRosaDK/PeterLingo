import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { physicalCubeAdapter, reconnectApprovedCube } from '../../hardware/smartcube/physicalCube';
import type {
  ConnectionState,
  CubeOrientation,
  SmartCubeAdapter,
} from '../../hardware/smartcube/types';
import { LivePhysicalCubeViewer } from './LivePhysicalCubeViewer';

const connectionLabel: Record<ConnectionState, string> = {
  unsupported: 'Bluetooth er ikke tilgængelig her',
  disconnected: 'GoCube er ikke forbundet',
  connecting: 'Forsøger at forbinde …',
  connected: 'GoCube følger med',
  error: 'GoCube kunne ikke nås',
};

export function RouxStartCube({ adapter = physicalCubeAdapter }: { adapter?: SmartCubeAdapter }) {
  const [connection, setConnection] = useState<ConnectionState>(() => adapter.getConnectionState());
  const [orientation, setOrientation] = useState<CubeOrientation | null>(
    () => adapter.getOrientation?.() ?? null
  );
  const [orientationReference, setOrientationReference] = useState<
    CubeOrientation | null | undefined
  >(undefined);
  const [message, setMessage] = useState('');
  const [calibrating, setCalibrating] = useState(false);

  useEffect(() => {
    let active = true;
    const refreshConnection = () => {
      if (!active) return;
      const next = adapter.getConnectionState();
      setConnection(next);
      if (next !== 'connected') setOrientation(null);
    };
    const offState = adapter.subscribeToState?.(refreshConnection);
    const offOrientation = adapter.subscribeToOrientation?.((nextOrientation) => {
      if (!active) return;
      setOrientation(nextOrientation);
      setConnection(adapter.getConnectionState());
    });

    const reconnect = async () => {
      if (!adapter.isSupported()) {
        setConnection('unsupported');
        return;
      }
      if (adapter.getConnectionState() === 'connected') {
        setConnection('connected');
        return;
      }
      setMessage('Leder stille efter en GoCube, som browseren allerede kender …');
      let connected = await reconnectApprovedCube(adapter);
      if (!connected && active && adapter.getConnectionState() !== 'connected') {
        connected = await reconnectApprovedCube(adapter, { retry: true });
      }
      if (!active) return;
      refreshConnection();
      setMessage(
        connected
          ? 'Forbindelsen er genetableret automatisk.'
          : 'Tænd cuben, og brug Opsætning, hvis browseren ikke allerede har gemt tilladelsen.'
      );
    };

    void reconnect();
    return () => {
      active = false;
      offState?.();
      offOrientation?.();
    };
  }, [adapter]);

  const calibrate = async () => {
    const currentOrientation = adapter.getOrientation?.() ?? orientation;
    if (connection !== 'connected' || !currentOrientation) return;
    setCalibrating(true);
    setMessage('Kalibrerer løst tilstand og 3D-retning …');
    try {
      if (!adapter.calibrateSolvedState) {
        throw new Error('Denne cube understøtter ikke nulstilling af løst tilstand.');
      }
      await adapter.calibrateSolvedState();
      setOrientationReference(currentOrientation);
      setMessage('Kalibreret: hvid/GO er op, grøn er frem, og cuben er registreret som løst.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'GoCube kunne ikke kalibreres.');
    } finally {
      setCalibrating(false);
      setConnection(adapter.getConnectionState());
    }
  };

  const canCalibrate = connection === 'connected' && Boolean(orientation) && !calibrating;

  return (
    <section className="roux-start-cube" aria-label="Live GoCube">
      <div className="roux-start-viewer">
        <div className="cube-hold-guide cube-hold-guide-top" aria-hidden="true">
          <b>HVID / GO</b>
          <span>↑ op</span>
        </div>
        <LivePhysicalCubeViewer
          adapter={adapter}
          orientationReference={orientationReference}
          frontView
        />
        <div className="cube-hold-guide cube-hold-guide-front" aria-hidden="true">
          <i />
          <span>Grøn side lige mod dig</span>
        </div>
      </div>
      <div className="roux-start-cube-controls">
        <div className={`cube-connection-state ${connection === 'connected' ? 'connected' : ''}`}>
          <i aria-hidden="true" />
          <span>{connectionLabel[connection]}</span>
        </div>
        <p className="roux-start-cube-message" aria-live="polite">
          {connection === 'connected' && !orientation
            ? 'Venter på cubens retningsmåler. Bevæg den ganske lidt.'
            : message}
        </p>
        <div className="button-row">
          <button
            type="button"
            className="button primary"
            disabled={!canCalibrate}
            onClick={() => void calibrate()}
          >
            {calibrating ? 'Kalibrerer …' : 'Kalibrer'}
          </button>
          {connection !== 'connected' && (
            <Link className="button secondary" to="/fag/roux/opsaetning">
              Forbind GoCube
            </Link>
          )}
        </div>
        <small>Hold den fysisk løste cube som vist, og tryk én gang.</small>
      </div>
    </section>
  );
}
