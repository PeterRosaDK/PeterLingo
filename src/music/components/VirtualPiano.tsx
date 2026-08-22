import { noteName } from '../pitch';
import { usePlayableNote } from './usePlayableNote';

interface VirtualPianoProps {
  from?: number;
  to?: number;
  naming?: 'danish' | 'international';
  showNames?: boolean;
  correctMidi?: number;
  selectedMidi?: number;
  onPlay?: (midi: number) => void;
}

const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);

export function VirtualPiano({
  from = 48,
  to = 72,
  naming = 'danish',
  showNames = true,
  correctMidi,
  selectedMidi,
  onPlay,
}: VirtualPianoProps) {
  const { start, stop } = usePlayableNote(onPlay);
  const all = Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const whites = all.filter((midi) => !isBlack(midi));
  const blacks = all.filter(isBlack).map((midi) => ({
    midi,
    whiteBefore: all.filter((candidate) => candidate < midi && !isBlack(candidate)).length,
  }));
  const keyState = (midi: number) =>
    midi === correctMidi ? ' correct' : midi === selectedMidi ? ' selected' : '';
  const events = (midi: number) => ({
    onPointerDown: (event: React.PointerEvent) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      start(midi);
    },
    onPointerUp: () => stop(midi),
    onPointerCancel: () => stop(midi),
    onPointerLeave: (event: React.PointerEvent) => {
      if (event.buttons) stop(midi);
    },
  });

  return (
    <div className="piano" aria-label="Virtuelt klaver">
      <div className="piano-whites">
        {whites.map((midi) => (
          <button
            key={midi}
            type="button"
            className={`piano-key white${keyState(midi)}`}
            aria-label={`Spil ${noteName(midi, naming)}`}
            {...events(midi)}
          >
            {showNames && <span>{noteName(midi, naming)}</span>}
          </button>
        ))}
      </div>
      {blacks.map(({ midi, whiteBefore }) => (
        <button
          key={midi}
          type="button"
          className={`piano-key black${keyState(midi)}`}
          style={{ left: `calc(${(whiteBefore / whites.length) * 100}% - ${50 / whites.length}%)` }}
          aria-label={`Spil ${noteName(midi, naming)}`}
          {...events(midi)}
        >
          {showNames && <span>{noteName(midi, naming, false, false)}</span>}
        </button>
      ))}
    </div>
  );
}
