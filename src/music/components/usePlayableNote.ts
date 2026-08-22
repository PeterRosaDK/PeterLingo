import { useCallback } from 'react';
import { getAudioEngine } from '../../audio/ToneAudioEngine';

export function usePlayableNote(onPlay?: (midi: number) => void) {
  const start = useCallback(
    (midi: number) => {
      onPlay?.(midi);
      void getAudioEngine().startNote(midi);
    },
    [onPlay]
  );
  const stop = useCallback((midi: number) => getAudioEngine().stopNote(midi), []);
  return { start, stop };
}
