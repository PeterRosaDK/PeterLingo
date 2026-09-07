import type { PeterLingoSnapshot } from '../../persistence/types';
import type { LearningUnit } from '../types';
import { flashcardEnabled } from '../../modules/flashcards/engine';
import { kochConfig, kochCount } from '../../modules/morse/domain';
export function sessionEligibility(snapshot: PeterLingoSnapshot): (unit: LearningUnit) => boolean {
  const morseSet = kochConfig.order.slice(0, kochCount(snapshot.attempts));
  return (u) =>
    u.discipline === 'flashcards'
      ? flashcardEnabled(u.id, snapshot.settings)
      : u.discipline === 'morse'
        ? morseSet.includes(u.id.split(':')[2] ?? '!')
        : true;
}
