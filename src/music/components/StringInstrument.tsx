import type { StringedInstrumentDefinition } from '../instruments';
import { pitchAt } from '../instruments';
import { noteName } from '../pitch';
import { usePlayableNote } from './usePlayableNote';

interface StringInstrumentProps {
  definition: StringedInstrumentDefinition;
  naming?: 'danish' | 'international';
  showNames?: boolean;
  showPitchGuides?: boolean;
  onPlay?: (midi: number) => void;
}

export function StringInstrument({
  definition,
  naming = 'danish',
  showNames = true,
  showPitchGuides = true,
  onPlay,
}: StringInstrumentProps) {
  const { start, stop } = usePlayableNote(onPlay);
  const positions = Array.from(
    { length: definition.defaultVisiblePositions + 1 },
    (_, index) => index
  );
  const events = (midi: number) => ({
    onPointerDown: (event: React.PointerEvent) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      start(midi);
    },
    onPointerUp: () => stop(midi),
    onPointerCancel: () => stop(midi),
  });
  const label =
    definition.id === 'guitar'
      ? 'guitargribebræt'
      : definition.id === 'bass'
        ? 'basgribebræt'
        : 'cellofingerbræt';

  return (
    <div
      className={`string-instrument ${definition.fretless ? 'fretless' : 'fretted'}`}
      aria-label={`Virtuelt ${label}`}
    >
      {definition.openStrings
        .slice()
        .reverse()
        .map((openMidi, reverseIndex) => {
          const stringIndex = definition.openStrings.length - 1 - reverseIndex;
          return (
            <div className="instrument-string" key={openMidi}>
              <span className="string-label">{noteName(openMidi, naming)}</span>
              <div className="string-track">
                {positions.map((position) => {
                  const midi = pitchAt(definition, stringIndex, position);
                  return (
                    <button
                      key={position}
                      type="button"
                      className={`string-position ${definition.fretless && showPitchGuides ? 'guide' : ''}`}
                      aria-label={`Spil ${noteName(midi, naming)} på ${reverseIndex + 1}. streng`}
                      {...events(midi)}
                    >
                      {(showNames || position === 0) && (
                        <span>{noteName(midi, naming, false, false)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      <div className="position-numbers" aria-hidden="true">
        <span>åben</span>
        {positions.slice(1).map((position) => (
          <span key={position}>{definition.fretless ? `+${position}` : position}</span>
        ))}
      </div>
    </div>
  );
}
