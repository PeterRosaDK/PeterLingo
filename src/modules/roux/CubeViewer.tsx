import { useEffect, useRef, useState } from 'react';
import { TwistyPlayer } from 'cubing/twisty';
import type { CubeOrientation } from '../../hardware/smartcube/types';

type Quaternion = CubeOrientation['quaternion'];
type PuzzleObject = Awaited<ReturnType<TwistyPlayer['experimentalCurrentThreeJSPuzzleObject']>>;

function multiplyQuaternion(left: Quaternion, right: Quaternion): Quaternion {
  return {
    x: left.w * right.x + left.x * right.w + left.y * right.z - left.z * right.y,
    y: left.w * right.y - left.x * right.z + left.y * right.w + left.z * right.x,
    z: left.w * right.z + left.x * right.y - left.y * right.x + left.z * right.w,
    w: left.w * right.w - left.x * right.x - left.y * right.y - left.z * right.z,
  };
}

function relativeQuaternion(current: Quaternion, reference: Quaternion): Quaternion {
  return multiplyQuaternion(current, {
    x: -reference.x,
    y: -reference.y,
    z: -reference.z,
    w: reference.w,
  });
}

export function CubeViewer({
  algorithm = '',
  compact = false,
  showAlgorithmStart = false,
  orientation = null,
  orientationReference = null,
}: {
  algorithm?: string;
  compact?: boolean;
  showAlgorithmStart?: boolean;
  orientation?: CubeOrientation | null;
  orientationReference?: CubeOrientation | null;
}) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<TwistyPlayer | null>(null);
  const puzzleObject = useRef<PuzzleObject | null>(null);
  const baseQuaternion = useRef<Quaternion | null>(null);
  const [viewerReady, setViewerReady] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    const instance = new TwistyPlayer({
      puzzle: '3x3x3',
      visualization: '3D',
      background: 'none',
      controlPanel: 'none',
      viewerLink: 'none',
      experimentalDragInput: 'auto',
      cameraLatitude: 28,
      cameraLongitude: 32,
    });
    host.current.replaceChildren(instance);
    player.current = instance;
    void instance.experimentalCurrentThreeJSPuzzleObject().then((object) => {
      if (player.current !== instance) return;
      puzzleObject.current = object;
      baseQuaternion.current = {
        x: object.quaternion.x,
        y: object.quaternion.y,
        z: object.quaternion.z,
        w: object.quaternion.w,
      };
      setViewerReady(true);
    });
    return () => {
      instance.remove();
      player.current = null;
      puzzleObject.current = null;
      baseQuaternion.current = null;
    };
  }, [compact]);

  useEffect(() => {
    if (!player.current) return;
    player.current.experimentalSetupAnchor = showAlgorithmStart ? 'end' : 'start';
    player.current.alg = algorithm;
    if (showAlgorithmStart) player.current.jumpToStart({ flash: false });
    else player.current.jumpToEnd({ flash: false });
  }, [algorithm, showAlgorithmStart]);

  useEffect(() => {
    const instance = player.current;
    const object = puzzleObject.current;
    const base = baseQuaternion.current;
    if (!instance || !object || !base) return;
    const delta =
      orientation && orientationReference
        ? relativeQuaternion(orientation.quaternion, orientationReference.quaternion)
        : { x: 0, y: 0, z: 0, w: 1 };
    const next = multiplyQuaternion(base, delta);
    object.quaternion.set(next.x, next.y, next.z, next.w);
    object.updateMatrixWorld(true);
    void instance.experimentalCurrentVantages().then((vantages) => {
      for (const vantage of vantages) vantage.scheduleRender();
    });
  }, [orientation, orientationReference, viewerReady]);

  return (
    <div
      className={`cube-viewer ${compact ? 'compact' : ''} ${orientation ? 'gyro-live' : ''}`}
      ref={host}
      aria-label="Interaktiv 3D Rubiks terning"
    />
  );
}
