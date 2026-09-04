import { useEffect, useState } from 'react';
import { physicalCubeAdapter } from '../../hardware/smartcube/physicalCube';
import type { CubeOrientation, SmartCubeAdapter } from '../../hardware/smartcube/types';
import { CubeViewer } from './CubeViewer';
import { solveFacelets, validateFacelets } from './faceletSolver';

export function LivePhysicalCubeViewer({
  compact = false,
  orientationReference,
  adapter = physicalCubeAdapter,
  frontView = false,
}: {
  compact?: boolean;
  orientationReference?: CubeOrientation | null;
  adapter?: SmartCubeAdapter;
  frontView?: boolean;
}) {
  const [facelets, setFacelets] = useState(() => adapter.getCubeState()?.facelets ?? null);
  const [orientation, setOrientation] = useState<CubeOrientation | null>(
    () => adapter.getOrientation?.() ?? null
  );
  const [solution, setSolution] = useState('');
  const faceletsAreValid = Boolean(facelets && validateFacelets(facelets).ok);

  useEffect(() => {
    const offState = adapter.subscribeToState?.((state) => {
      setFacelets(state?.facelets ?? null);
      if (adapter.getConnectionState() !== 'connected') setOrientation(null);
    });
    const offOrientation = adapter.subscribeToOrientation?.(setOrientation);
    return () => {
      offState?.();
      offOrientation?.();
    };
  }, [adapter]);

  useEffect(() => {
    let cancelled = false;
    let timeout = 0;
    if (!facelets || !validateFacelets(facelets).ok) return;
    timeout = window.setTimeout(() => {
      void solveFacelets(facelets)
        .then((result) => {
          if (!cancelled) setSolution(result.algorithm);
        })
        .catch(() => {
          if (!cancelled) setSolution('');
        });
    }, 140);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [facelets]);

  return (
    <CubeViewer
      algorithm={faceletsAreValid ? solution : ''}
      compact={compact}
      showAlgorithmStart
      orientation={orientation}
      orientationReference={orientationReference}
      cameraLatitude={frontView ? 0 : 28}
      cameraLongitude={frontView ? 0 : 32}
      allowDrag={!frontView}
    />
  );
}
