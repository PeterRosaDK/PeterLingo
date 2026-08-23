import type { ScheduledLearningUnit } from '../../learning/fsrs/scheduler';
import { learningStageLabel } from '../../learning/stages';
import type { LearningStage, MasteryRecord } from '../../learning/types';

export type CardsSkillId =
  | 'suit-values'
  | 'rank-reduction'
  | 'suit-relationship'
  | 'next-card'
  | 'previous-card'
  | 'multi-forward'
  | 'card-to-position'
  | 'position-to-card'
  | 'cyclic-offsets'
  | 'cuts-and-targets';

export interface CardsSkill {
  id: CardsSkillId;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  fluentThresholdMs: number;
  unitPrefix: string;
}

export const CARDS_SKILLS: CardsSkill[] = [
  {
    id: 'suit-values',
    number: 1,
    title: 'Kulørværdier',
    shortTitle: 'Kulørtal',
    description: 'Gør spar 1, hjerter 2, klør 3 og ruder 4 automatiske.',
    fluentThresholdMs: 5_000,
    unitPrefix: 'cards:suit-values',
  },
  {
    id: 'rank-reduction',
    number: 2,
    title: 'Ny kortværdi',
    shortTitle: 'Kortværdi',
    description: 'Fordobl og reducer først; læg så kulørtallet til som i Osterlinds regel.',
    fluentThresholdMs: 9_000,
    unitPrefix: 'cards:rank-reduction',
  },
  {
    id: 'suit-relationship',
    number: 3,
    title: 'Ny kulør',
    shortTitle: 'Kulørregel',
    description: 'Vælg samme, samme farve, forrige eller næste kulør ud fra den nye værdi.',
    fluentThresholdMs: 8_000,
    unitPrefix: 'cards:suit-relationship',
  },
  {
    id: 'next-card',
    number: 4,
    title: 'Næste kort',
    shortTitle: 'Fremad',
    description: 'Sæt værdi og kulør sammen til det næste BCS-kort.',
    fluentThresholdMs: 8_000,
    unitPrefix: 'cards:bcs-next',
  },
  {
    id: 'previous-card',
    number: 5,
    title: 'Forrige kort',
    shortTitle: 'Baglæns',
    description: 'Genkend naboen baglæns uden først at løbe hele rækken forfra.',
    fluentThresholdMs: 8_000,
    unitPrefix: 'cards:bcs-previous',
  },
  {
    id: 'multi-forward',
    number: 6,
    title: 'Flere kort frem',
    shortTitle: 'Flere frem',
    description: 'Følg BCS-kæden to til fem kort frem fra et vilkårligt udgangspunkt.',
    fluentThresholdMs: 14_000,
    unitPrefix: 'cards:bcs-forward',
  },
  {
    id: 'card-to-position',
    number: 7,
    title: 'Kort → position',
    shortTitle: 'Kort til tal',
    description: 'Se et kort og svar med dets faste plads i MBCS.',
    fluentThresholdMs: 6_000,
    unitPrefix: 'cards:card-to-position:',
  },
  {
    id: 'position-to-card',
    number: 8,
    title: 'Position → kort',
    shortTitle: 'Tal til kort',
    description: 'Se en position og find kortet direkte — som en selvstændig hukommelsesretning.',
    fluentThresholdMs: 6_000,
    unitPrefix: 'cards:position-to-card:',
  },
  {
    id: 'cyclic-offsets',
    number: 9,
    title: 'Afstande i stakken',
    shortTitle: 'Afstande',
    description: 'Regn frem og tilbage gennem position 52 uden at miste stakkens cyklus.',
    fluentThresholdMs: 10_000,
    unitPrefix: 'cards:cyclic-offsets',
  },
  {
    id: 'cuts-and-targets',
    number: 10,
    title: 'Cuts og målpositioner',
    shortTitle: 'Stabelregning',
    description: 'Følg et kort efter et cut, flyt det til et mål og håndtér fjernede topkort.',
    fluentThresholdMs: 14_000,
    unitPrefix: 'cards:cuts-and-targets',
  },
];

export function getCardsSkill(id: CardsSkillId): CardsSkill {
  return CARDS_SKILLS.find((skill) => skill.id === id)!;
}

export function cardsSkillMatchesUnit(skill: CardsSkill, learningUnitId: string): boolean {
  return skill.unitPrefix.endsWith(':')
    ? learningUnitId.startsWith(skill.unitPrefix)
    : learningUnitId === skill.unitPrefix || learningUnitId.startsWith(`${skill.unitPrefix}:`);
}

function recordsForSkill(skill: CardsSkill, mastery: MasteryRecord[]): MasteryRecord[] {
  return mastery.filter((record) => cardsSkillMatchesUnit(skill, record.learningUnitId));
}

export function cardsSkillStrength(skill: CardsSkill, mastery: MasteryRecord[]): number | null {
  const records = recordsForSkill(skill, mastery);
  if (!records.length) return null;
  return records.reduce((sum, record) => sum + record.strength, 0) / records.length;
}

export function cardsSkillStage(
  skill: CardsSkill,
  mastery: MasteryRecord[]
): LearningStage | undefined {
  const records = recordsForSkill(skill, mastery);
  if (!records.length) return undefined;
  return [...records].sort((a, b) => a.strength - b.strength)[0]?.stage;
}

export function cardsSkillStatus(skill: CardsSkill, mastery: MasteryRecord[]): string {
  return learningStageLabel(cardsSkillStage(skill, mastery));
}

export function recommendCardsSkill(
  mastery: MasteryRecord[],
  scheduled: ScheduledLearningUnit[],
  now = new Date()
): CardsSkill {
  const due = CARDS_SKILLS.filter((skill) =>
    scheduled.some(
      (card) =>
        cardsSkillMatchesUnit(skill, card.learningUnitId) &&
        new Date(card.due).getTime() <= now.getTime()
    )
  ).sort(
    (a, b) =>
      (cardsSkillStrength(a, mastery) ?? 0) - (cardsSkillStrength(b, mastery) ?? 0) ||
      a.number - b.number
  );
  if (due[0]) return due[0];

  const unseen = CARDS_SKILLS.find((skill) => cardsSkillStrength(skill, mastery) === null);
  if (unseen) return unseen;

  return (
    [...CARDS_SKILLS].sort(
      (a, b) =>
        (cardsSkillStrength(a, mastery) ?? 0) - (cardsSkillStrength(b, mastery) ?? 0) ||
        a.number - b.number
    )[0] ?? CARDS_SKILLS[0]!
  );
}
