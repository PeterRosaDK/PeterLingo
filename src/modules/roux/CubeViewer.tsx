import { useEffect, useRef } from 'react';
import { TwistyPlayer } from 'cubing/twisty';

export function CubeViewer({
  algorithm = '',
  compact = false,
}: {
  algorithm?: string;
  compact?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<TwistyPlayer | null>(null);

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
    return () => {
      instance.remove();
      player.current = null;
    };
  }, [compact]);

  useEffect(() => {
    if (!player.current) return;
    player.current.alg = algorithm;
    player.current.jumpToEnd({ flash: false });
  }, [algorithm]);

  return (
    <div
      className={`cube-viewer ${compact ? 'compact' : ''}`}
      ref={host}
      aria-label="Interaktiv 3D Rubiks terning"
    />
  );
}
