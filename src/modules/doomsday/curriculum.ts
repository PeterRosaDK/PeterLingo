import type { ScheduledLearningUnit } from '../../learning/fsrs/scheduler';
import { learningStageLabel } from '../../learning/stages';
import type { MasteryRecord } from '../../learning/types';

export type DoomsdaySkillId =
  | 'weekday-numbering'
  | 'century-anchors'
  | 'year-calculation'
  | 'month-anchors'
  | 'leap-years'
  | 'complete-date';

export interface DoomsdaySkill {
  id: DoomsdaySkillId;
  learningUnitId: `doomsday:${DoomsdaySkillId}`;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  fluentThresholdMs: number;
}

export const DOOMSDAY_SKILLS: DoomsdaySkill[] = [
  {
    id: 'weekday-numbering',
    learningUnitId: 'doomsday:weekday-numbering',
    number: 1,
    title: 'Ugedagenes tal',
    shortTitle: 'Ugedagstal',
    description: 'Forbind søndag–lørdag med tallene 0–6 i begge retninger.',
    fluentThresholdMs: 6_000,
  },
  {
    id: 'century-anchors',
    learningUnitId: 'doomsday:century-anchors',
    number: 2,
    title: 'Århundredets anker',
    shortTitle: 'Århundrede',
    description: 'Find det faste udgangspunkt for 1800-, 1900-, 2000- og 2100-tallet.',
    fluentThresholdMs: 8_000,
  },
  {
    id: 'year-calculation',
    learningUnitId: 'doomsday:year-calculation',
    number: 3,
    title: 'Årets dommedag',
    shortTitle: 'Årsregning',
    description: 'Omsæt årets sidste to cifre til et lille antal skridt på ugehjulet.',
    fluentThresholdMs: 15_000,
  },
  {
    id: 'month-anchors',
    learningUnitId: 'doomsday:month-anchors',
    number: 4,
    title: 'Månedernes huskedatoer',
    shortTitle: 'Månedsankre',
    description: 'Lær den dato i hver måned, som altid falder på årets dommedag.',
    fluentThresholdMs: 8_000,
  },
  {
    id: 'leap-years',
    learningUnitId: 'doomsday:leap-years',
    number: 5,
    title: 'Skudår',
    shortTitle: 'Skudår',
    description: 'Genkend skudår og flyt januar og februars huskedatoer korrekt.',
    fluentThresholdMs: 10_000,
  },
  {
    id: 'complete-date',
    learningUnitId: 'doomsday:complete-date',
    number: 6,
    title: 'Hele datoen',
    shortTitle: 'Hel dato',
    description: 'Sæt alle trinnene sammen med fødselsdatoer fra 1975–2000 som første fokus.',
    fluentThresholdMs: 18_000,
  },
];

export function getDoomsdaySkill(id: DoomsdaySkillId): DoomsdaySkill {
  return DOOMSDAY_SKILLS.find((skill) => skill.id === id)!;
}

export function recommendDoomsdaySkill(
  mastery: MasteryRecord[],
  scheduled: ScheduledLearningUnit[],
  now = new Date()
): DoomsdaySkill {
  const masteryById = new Map(mastery.map((record) => [record.learningUnitId, record]));
  const scheduledById = new Map(scheduled.map((card) => [card.learningUnitId, card]));
  const due = DOOMSDAY_SKILLS.filter((skill) => {
    const card = scheduledById.get(skill.learningUnitId);
    return card && new Date(card.due).getTime() <= now.getTime();
  }).sort(
    (a, b) =>
      (masteryById.get(a.learningUnitId)?.strength ?? 0) -
        (masteryById.get(b.learningUnitId)?.strength ?? 0) || a.number - b.number
  );
  if (due[0]) return due[0];

  const firstUnseen = DOOMSDAY_SKILLS.find((skill) => !masteryById.has(skill.learningUnitId));
  if (firstUnseen) return firstUnseen;

  return (
    [...DOOMSDAY_SKILLS].sort(
      (a, b) =>
        (masteryById.get(a.learningUnitId)?.strength ?? 0) -
          (masteryById.get(b.learningUnitId)?.strength ?? 0) || a.number - b.number
    )[0] ?? DOOMSDAY_SKILLS[0]!
  );
}

export { learningStageLabel as masteryLabel };
