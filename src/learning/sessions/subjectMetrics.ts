import type { Attempt } from '../types';
export function subjectMetrics(attempts: Attempt[]) {
  const groups = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const p = a.generatedParameters;
    const key =
      [
        p.deckId,
        p.subset,
        p.direction,
        p.topic,
        p.mode,
        p.character,
        p.tier ? `trin ${p.tier}` : undefined,
      ]
        .filter((v) => typeof v === 'string' || typeof v === 'number')
        .join(' · ') ||
      a.learningUnitId.split(':')[1] ||
      'Træning';
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  return [...groups].map(([label, items]) => {
    const timed = items
      .filter((a) => a.generatedParameters.recallMode !== 'self-report')
      .map((a) => a.responseTimeMs)
      .sort((a, b) => a - b);
    return {
      label,
      effectiveWpm:
        typeof items.at(-1)?.generatedParameters.effectiveWpm === 'number'
          ? Number(items.at(-1)!.generatedParameters.effectiveWpm)
          : null,
      timingError: items
        .filter((a) => typeof a.generatedParameters.error === 'number')
        .map((a) => Number(a.generatedParameters.error)),
      count: items.length,
      accuracy: items.filter((a) => a.correct).length / items.length,
      latencyMs: timed.length ? timed[Math.floor(timed.length / 2)]! : null,
      partialCredit: items
        .filter((a) => typeof a.generatedParameters.partialCredit === 'number')
        .map((a) => Number(a.generatedParameters.partialCredit)),
      confusions: items.flatMap((a) =>
        Array.isArray(a.generatedParameters.substitutions)
          ? a.generatedParameters.substitutions.map(String)
          : []
      ),
    };
  });
}
