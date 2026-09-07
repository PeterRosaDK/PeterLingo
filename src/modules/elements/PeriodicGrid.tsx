import { elements, gridPosition } from './domain';
export function PeriodicGrid({
  reference = false,
  onSelect,
  disabled = false,
  answer,
}: {
  reference?: boolean;
  onSelect?: (n: number) => void;
  disabled?: boolean;
  answer?: number;
}) {
  return (
    <div
      className="periodic-scroll"
      tabIndex={0}
      aria-label="Periodisk system, rul vandret på små skærme"
    >
      <div className={`periodic-grid ${reference ? 'reference' : ''}`}>
        {elements.map((e) => {
          const [row, column] = gridPosition(e);
          return (
            <button
              type="button"
              key={e.atomicNumber}
              disabled={disabled}
              className={answer === e.atomicNumber ? 'correct-answer' : ''}
              style={{ gridRow: row, gridColumn: column }}
              aria-label={
                reference
                  ? `${e.atomicNumber} ${e.danishName}`
                  : `Periode ${e.period}, ${e.group ? `gruppe ${e.group}` : `f-blok position ${column - 2}`}`
              }
              onClick={() => onSelect?.(e.atomicNumber)}
            >
              {reference ? (
                <>
                  <small>{e.atomicNumber}</small>
                  <strong>{e.symbol}</strong>
                  <span>{e.danishName}</span>
                  <span>{e.englishName}</span>
                  <small>{e.songIndex ? `♪ ${e.songIndex}` : 'Ikke i sangen'}</small>
                </>
              ) : (
                <span aria-hidden="true">{answer === e.atomicNumber ? e.symbol : '·'}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
