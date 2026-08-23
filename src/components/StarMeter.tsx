import { DAILY_STAR_TARGET } from '../learning/gamification/dailyStars';

export function StarMeter({ stars, compact = false }: { stars: number; compact?: boolean }) {
  const bounded = Math.max(0, Math.min(DAILY_STAR_TARGET, Math.trunc(stars)));
  return (
    <span
      className={`star-meter ${compact ? 'compact' : ''}`}
      aria-label={`${bounded} af ${DAILY_STAR_TARGET} stjerner i dag`}
    >
      {Array.from({ length: DAILY_STAR_TARGET }, (_, index) => (
        <i className={index < bounded ? 'earned' : ''} aria-hidden="true" key={index}>
          ★
        </i>
      ))}
      {!compact && <small>dagens indsats</small>}
    </span>
  );
}
