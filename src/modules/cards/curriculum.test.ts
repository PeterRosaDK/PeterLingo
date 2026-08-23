import { describe, expect, it } from 'vitest';
import type { ScheduledLearningUnit } from '../../learning/fsrs/scheduler';
import type { MasteryRecord } from '../../learning/types';
import {
  CARDS_SKILLS,
  cardsSkillMatchesUnit,
  cardsSkillStrength,
  recommendCardsSkill,
} from './curriculum';

const mastery = (learningUnitId: string, strength: number): MasteryRecord => ({
  learningUnitId,
  discipline: 'cards',
  stage: 'unassisted',
  strength,
  updatedAt: '2026-08-23T12:00:00.000Z',
});

const due = (learningUnitId: string): ScheduledLearningUnit => ({
  learningUnitId,
  due: '2026-08-22T12:00:00.000Z',
  stability: 1,
  difficulty: 5,
  elapsedDays: 0,
  scheduledDays: 1,
  reps: 1,
  lapses: 0,
  learningSteps: 1,
  state: 1,
});

describe('BCS/MBCS curriculum', () => {
  it('keeps the two MBCS recall directions separate', () => {
    const cardToPosition = CARDS_SKILLS.find((skill) => skill.id === 'card-to-position')!;
    const positionToCard = CARDS_SKILLS.find((skill) => skill.id === 'position-to-card')!;

    expect(cardsSkillMatchesUnit(cardToPosition, 'cards:card-to-position:7H')).toBe(true);
    expect(cardsSkillMatchesUnit(cardToPosition, 'cards:position-to-card:47')).toBe(false);
    expect(cardsSkillMatchesUnit(positionToCard, 'cards:position-to-card:47')).toBe(true);
  });

  it('averages the independently scheduled cards within a track', () => {
    const skill = CARDS_SKILLS.find((item) => item.id === 'card-to-position')!;
    expect(
      cardsSkillStrength(skill, [
        mastery('cards:card-to-position:1S', 0.2),
        mastery('cards:card-to-position:7H', 0.8),
      ])
    ).toBe(0.5);
  });

  it('starts at the foundation and prioritizes a due positional unit later', () => {
    expect(recommendCardsSkill([], []).id).toBe('suit-values');
    expect(
      recommendCardsSkill(
        [mastery('cards:suit-values', 0.8)],
        [due('cards:position-to-card:23')],
        new Date('2026-08-23T12:00:00.000Z')
      ).id
    ).toBe('position-to-card');
  });
});
