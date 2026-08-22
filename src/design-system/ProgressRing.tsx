export function ProgressRing({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <span
      className="progress-ring"
      style={{ '--progress': `${clamped * 360}deg` } as React.CSSProperties}
      aria-label={`${label}: ${Math.round(clamped * 100)} procent`}
    >
      <span>{Math.round(clamped * 100)}%</span>
    </span>
  );
}
