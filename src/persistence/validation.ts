import { CURRENT_SCHEMA_VERSION, createEmptySnapshot, type PeterLingoSnapshot } from './types';

export class ImportValidationError extends Error {}

export function parseSnapshot(value: unknown): PeterLingoSnapshot {
  if (!value || typeof value !== 'object')
    throw new ImportValidationError('Filen indeholder ikke PeterLingo-data.');
  const candidate = value as Partial<PeterLingoSnapshot>;
  if (candidate.schemaVersion !== 1 && candidate.schemaVersion !== CURRENT_SCHEMA_VERSION) {
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
  const decks = candidate.settings.deckSettings ?? {};
  if (!decks || typeof decks !== 'object' || Array.isArray(decks))
    throw new ImportValidationError('Ugyldige deck-indstillinger.');
  for (const entry of Object.values(decks)) {
    if (
      !entry ||
      typeof entry.enabled !== 'boolean' ||
      !Array.isArray(entry.subsets) ||
      !entry.subsets.every((v) => typeof v === 'string') ||
      !Array.isArray(entry.directions) ||
      !entry.directions.every((v) => typeof v === 'string')
    )
      throw new ImportValidationError('Ugyldigt deck-udvalg.');
  }
  return {
    ...fallback,
    ...candidate,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: {
      ...fallback.settings,
      ...candidate.settings,
      deckSettings: decks,
      focusWeights: { ...fallback.settings.focusWeights, ...candidate.settings.focusWeights },
    },
    hardware: { ...fallback.hardware, ...candidate.hardware },
  } as PeterLingoSnapshot;
}
