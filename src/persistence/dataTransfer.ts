import type { LearningRepository } from './repository';
import { parseSnapshot } from './validation';

export async function exportLearningData(repository: LearningRepository): Promise<string> {
  const snapshot = await repository.load();
  return JSON.stringify({ ...snapshot, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importLearningData(
  repository: LearningRepository,
  json: string
): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Filen er ikke gyldig JSON.');
  }
  await repository.replace(parseSnapshot(parsed));
}
