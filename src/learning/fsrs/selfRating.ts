import type { SchedulerGrade } from '../types';
export const selfRatings: { grade: SchedulerGrade; label: string }[] = [
  { grade: 'again', label: 'Kunne ikke' },
  { grade: 'hard', label: 'Næsten' },
  { grade: 'good', label: 'Kunne' },
  { grade: 'easy', label: 'Let' },
];
// Normal reveal follows mental recall. Only a prior answer hint counts as assisted reveal.
export function gradeSelfRecall(
  rating: SchedulerGrade,
  hints: number,
  revealed: boolean
): SchedulerGrade {
  if (revealed || rating === 'again') return 'again';
  return hints > 0 && rating !== 'hard' ? 'hard' : rating;
}
