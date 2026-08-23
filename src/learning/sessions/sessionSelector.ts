import type { ScheduledLearningUnit } from '../fsrs/scheduler';
import type { Attempt, LearningUnit, MasteryRecord, SessionRecord } from '../types';
import { disciplineForLearningUnitId } from './catalog';
import { estimatedSecondsForUnit } from './sessionInsights';

export interface SessionSelectionInput {
  catalog: LearningUnit[];
  scheduled: ScheduledLearningUnit[];
  mastery: MasteryRecord[];
  recentSessions: SessionRecord[];
  focusWeights: Record<string, number>;
  attempts?: Attempt[];
  now?: Date;
  targetMinutes?: number;
  maxNewItems?: number;
}

function expandedCatalog(input: SessionSelectionInput): LearningUnit[] {
  const masteryById = new Map(input.mastery.map((record) => [record.learningUnitId, record]));
  const catalog = [...input.catalog];
  for (const card of input.scheduled) {
    if (catalog.some((unit) => unit.id === card.learningUnitId)) continue;
    const discipline = disciplineForLearningUnitId(card.learningUnitId);
    if (!discipline) continue;
    catalog.push({
      id: card.learningUnitId,
      discipline,
      title: card.learningUnitId.split(':').slice(1).join(' · '),
      stage: masteryById.get(card.learningUnitId)?.stage ?? 'assisted',
      estimatedSeconds: 60,
    });
  }
  return catalog.map((unit) => ({
    ...unit,
    estimatedSeconds: estimatedSecondsForUnit(unit, input.attempts ?? []),
  }));
}

export function resolveLearningUnits(
  input: SessionSelectionInput,
  learningUnitIds: string[]
): LearningUnit[] {
  const byId = new Map(expandedCatalog(input).map((unit) => [unit.id, unit]));
  return learningUnitIds.flatMap((id) => {
    const unit = byId.get(id);
    return unit ? [unit] : [];
  });
}

export function selectDailySession(input: SessionSelectionInput): LearningUnit[] {
  const now = input.now ?? new Date();
  const budgetSeconds = (input.targetMinutes ?? 7) * 60;
  const maxNew = input.maxNewItems ?? 3;
  const scheduledById = new Map(input.scheduled.map((card) => [card.learningUnitId, card]));
  const masteryById = new Map(input.mastery.map((record) => [record.learningUnitId, record]));
  const recentIds = new Set(
    input.recentSessions.slice(-2).flatMap((session) => session.plannedUnitIds)
  );

  const ranked = expandedCatalog(input)
    .map((unit) => {
      const card = scheduledById.get(unit.id);
      const due = card ? new Date(card.due).getTime() <= now.getTime() : false;
      const strength = masteryById.get(unit.id)?.strength ?? 0;
      const weight = input.focusWeights[unit.discipline] ?? 1;
      const recentPenalty = recentIds.has(unit.id) ? 18 : 0;
      return {
        unit,
        due,
        score: (due ? 100 : 0) + (1 - strength) * 45 + weight * 10 - recentPenalty,
      };
    })
    .sort((a, b) => b.score - a.score);

  const selected: LearningUnit[] = [];
  let seconds = 0;
  let newItems = 0;
  for (const candidate of ranked) {
    const unseen = !scheduledById.has(candidate.unit.id);
    if (unseen && newItems >= maxNew) continue;
    if (
      unseen &&
      selected.some((unit) => unit.discipline === candidate.unit.discipline) &&
      ranked.some(
        (alternative) =>
          !scheduledById.has(alternative.unit.id) &&
          !selected.includes(alternative.unit) &&
          !selected.some((unit) => unit.discipline === alternative.unit.discipline)
      )
    )
      continue;
    if (seconds + candidate.unit.estimatedSeconds > budgetSeconds && selected.length >= 3) continue;
    selected.push(candidate.unit);
    seconds += candidate.unit.estimatedSeconds;
    if (unseen) newItems += 1;
    if (seconds >= budgetSeconds) break;
  }
  return selected;
}
