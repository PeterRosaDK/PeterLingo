import { CURRENT_SCHEMA_VERSION, createEmptySnapshot, type PeterLingoSnapshot } from './types';

export class ImportValidationError extends Error {}

export function parseSnapshot(value: unknown): PeterLingoSnapshot {
  if (!value || typeof value !== 'object')
    throw new ImportValidationError('Filen indeholder ikke PeterLingo-data.');
  const candidate = value as Partial<PeterLingoSnapshot>;
  if (candidate.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new ImportValidationError(`Ukendt dataversion: ${String(candidate.schemaVersion)}.`);
  }
  const requiredArrays = [
    'scheduledUnits',
    'mastery',
    'attempts',
    'sessions',
    'diagnostics',
  ] as const;
  for (const key of requiredArrays) {
    if (!Array.isArray(candidate[key])) throw new ImportValidationError(`Feltet ${key} mangler.`);
  }
  if (!candidate.settings || !candidate.hardware)
    throw new ImportValidationError('Indstillinger mangler.');
  const fallback = createEmptySnapshot();
  return {
    ...fallback,
    ...candidate,
    settings: {
      ...fallback.settings,
      ...candidate.settings,
      focusWeights: { ...fallback.settings.focusWeights, ...candidate.settings.focusWeights },
    },
    hardware: { ...fallback.hardware, ...candidate.hardware },
  } as PeterLingoSnapshot;
}
