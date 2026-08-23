import { describe, expect, it } from 'vitest';
import type { ScheduledLearningUnit } from '../../learning/fsrs/scheduler';
import type { MasteryRecord } from '../../learning/types';
import { DOOMSDAY_SKILLS, doomsdayRecommendation, recommendDoomsdaySkill } from './curriculum';

const mastery = (learningUnitId: string, strength: number): MasteryRecord => ({
  learningUnitId,
  discipline: 'doomsday',
  stage: 'unassisted',
  strength,
  updatedAt: '2026-08-23T10:00:00.000Z',
});

const scheduled = (learningUnitId: string, due: string): ScheduledLearningUnit => ({
  learningUnitId,
  due,
  stability: 1,
  difficulty: 5,
  elapsedDays: 0,
  scheduledDays: 1,
  reps: 1,
  lapses: 0,
  learningSteps: 1,
  state: 1,
});

describe('Doomsday recommendation', () => {
  it('starts with the first unseen foundation', () => {
    expect(recommendDoomsdaySkill([], []).id).toBe('weekday-numbering');
  });

  it('continues to the first unseen step in curriculum order', () => {
    const records = [mastery('doomsday:weekday-numbering', 0.9)];
    expect(recommendDoomsdaySkill(records, []).id).toBe('century-anchors');
    expect(doomsdayRecommendation(records, []).reason).toBe('next-new');
  });

  it('prioritizes a due weak step over a new step', () => {
    const records = [mastery('doomsday:weekday-numbering', 0.2)];
    const cards = [scheduled('doomsday:weekday-numbering', '2026-08-22T10:00:00.000Z')];
    expect(recommendDoomsdaySkill(records, cards, new Date('2026-08-23T10:00:00.000Z')).id).toBe(
      'weekday-numbering'
    );
    expect(
      doomsdayRecommendation(records, cards, new Date('2026-08-23T10:00:00.000Z')).reason
    ).toBe('due-review');
  });

  it('returns the weakest skill after all six have been seen', () => {
    const records = DOOMSDAY_SKILLS.map((skill, index) =>
      mastery(skill.learningUnitId, index === 3 ? 0.1 : 0.8)
    );
    expect(recommendDoomsdaySkill(records, []).id).toBe('month-anchors');
    expect(doomsdayRecommendation(records, []).reason).toBe('weakest');
  });
});
