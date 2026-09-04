import { useEffect, useState, type ReactNode } from 'react';
import type { CubeOrientation, SmartCubeAdapter } from '../../hardware/smartcube/types';
import { LivePhysicalCubeViewer } from './LivePhysicalCubeViewer';

export function RouxPhaseCubePanel({
  adapter,
  isLiveReady,
  children,
}: {
  adapter: SmartCubeAdapter;
  isLiveReady: boolean;
  children?: ReactNode;
}) {
  const [orientation, setOrientation] = useState<CubeOrientation | null>(
    () => adapter.getOrientation?.() ?? null
  );
  const [orientationReference, setOrientationReference] = useState<
    CubeOrientation | null | undefined
  >(undefined);
  const [calibrationMessage, setCalibrationMessage] = useState('');
  const connection = adapter.getConnectionState();

  useEffect(() => {
    const offOrientation = adapter.subscribeToOrientation?.(setOrientation);
    const offState = adapter.subscribeToState?.(() => {
      if (adapter.getConnectionState() !== 'connected') {
        setOrientation(null);
        setOrientationReference(undefined);
      }
    });
    return () => {
      offOrientation?.();
      offState?.();
    };
  }, [adapter]);

  const calibrate = () => {
    const currentOrientation = adapter.getOrientation?.() ?? orientation;
    if (adapter.getConnectionState() !== 'connected' || !currentOrientation) return;
    setOrientationReference(currentOrientation);
    setCalibrationMessage('Grøn vises nu direkte forfra med hvid/GO ovenpå. Farverne er urørte.');
  };

  return (
    <article className="first-block-cube-panel physical">
      <header>
        <div>
          <p className="eyebrow">Din cube</p>
          <h3>Det GoCube ser lige nu</h3>
        </div>
        <span className={`live-indicator ${isLiveReady ? 'connected' : ''}`}>
          {isLiveReady ? 'Live' : 'Offline'}
        </span>
      </header>
      <div className="first-block-viewer-frame">
        <LivePhysicalCubeViewer
          adapter={adapter}
          orientationReference={orientationReference}
          frontView={orientationReference !== undefined}
        />
      </div>
      <p className="viewer-caption">
        {isLiveReady
          ? orientationReference !== undefined
            ? 'Kalibreret: grøn lige forfra og hvid/GO ovenpå.'
            : 'Farver og bevægelser følger din fysiske cube.'
          : 'Forbind GoCube for live farver. Modellen kan stadig bruges som støtte.'}
      </p>
      <div className="phase-cube-actions">
        <button
          className="button secondary compact"
          disabled={connection !== 'connected' || !orientation}
          onClick={calibrate}
          type="button"
        >
          Kalibrer 3D
        </button>
        <small>Retter kun modellens synsvinkel — aldrig cubens farver eller løsning.</small>
      </div>
      {calibrationMessage && (
        <small className="phase-calibration-message" role="status">
          {calibrationMessage}
        </small>
      )}
      {children}
    </article>
  );
}
