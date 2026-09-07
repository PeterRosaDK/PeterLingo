import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLearningData } from '../../app/DataProvider';
import type { LearningUnit } from '../../learning/types';
import { RecallPanel } from './RecallPanel';
import type { RecallExercise } from './recall';
export function recommendedUnit(
  units: LearningUnit[],
  snapshot: ReturnType<typeof useLearningData>['snapshot']
): LearningUnit | undefined {
  const now = Date.now();
  return [...units].sort((a, b) => {
    const score = (u: LearningUnit) => {
      const card = snapshot.scheduledUnits.find((c) => c.learningUnitId === u.id);
      const last = snapshot.attempts.filter((a) => a.learningUnitId === u.id).at(-1);
      return (
        (card && Date.parse(card.due) <= now ? 100 : !card ? 50 : 0) +
        (1 - (snapshot.mastery.find((m) => m.learningUnitId === u.id)?.strength ?? 0)) * 10 -
        (last && now - Date.parse(last.attemptedAt) < 60000 ? 200 : 0)
      );
    };
    return score(b) - score(a);
  })[0];
}
export function Practice({
  units,
  generate,
  effectiveWpm,
  hideUnitSelector = false,
}: {
  hideUnitSelector?: boolean;
  units: LearningUnit[];
  generate: (u: LearningUnit) => RecallExercise;
  effectiveWpm?: number;
}) {
  const { snapshot } = useLearningData();
  const [params] = useSearchParams();
  const initial =
    units.find((u) => u.id === params.get('unit')) ?? recommendedUnit(units, snapshot);
  const [selected, setSelected] = useState(initial?.id ?? '');
  const [counter, setCounter] = useState(0);
  const active = units.find((u) => u.id === selected) ?? initial;
  if (!active) return <p>Ingen aktive øvelser. Aktivér et udvalg for at træne.</p>;
  return (
    <>
      {!hideUnitSelector && (
        <label className="practice-select">
          Fri træning · vælg øvelse
          <select value={active.id} onChange={(e) => setSelected(e.target.value)}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <FrozenExercise
        key={`${active.id}:${counter}`}
        unit={active}
        generate={generate}
        effectiveWpm={effectiveWpm}
        next={() => {
          setSelected(recommendedUnit(units, snapshot)?.id ?? active.id);
          setCounter((n) => n + 1);
        }}
      />
    </>
  );
}
function FrozenExercise({
  unit,
  generate,
  next,
  effectiveWpm,
}: {
  unit: LearningUnit;
  generate: (u: LearningUnit) => RecallExercise;
  next: () => void;
  effectiveWpm?: number;
}) {
  const { snapshot } = useLearningData();
  const [exercise] = useState(() => generate(unit));
  return (
    <RecallPanel
      exercise={exercise}
      stage={snapshot.mastery.find((m) => m.learningUnitId === unit.id)?.stage ?? unit.stage}
      next={next}
      effectiveWpm={effectiveWpm}
    />
  );
}
