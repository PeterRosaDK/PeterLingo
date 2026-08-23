import { describe, expect, it } from 'vitest';
import { exportLearningData, importLearningData } from './dataTransfer';
import { InMemoryLearningRepository } from './inMemoryRepository';

describe('JSON portability', () => {
  it('exports and imports a versioned snapshot', async () => {
    const source = new InMemoryLearningRepository();
    const json = await exportLearningData(source);
    const target = new InMemoryLearningRepository();
    await importLearningData(target, json);
    expect((await target.load()).schemaVersion).toBe(1);
  });

  it('rejects unknown schemas', async () => {
    await expect(
      importLearningData(new InMemoryLearningRepository(), '{"schemaVersion":99}')
    ).rejects.toThrow('Ukendt dataversion');
  });

  it('adds the default feedback sound setting to an older schema-one export', async () => {
    const source = new InMemoryLearningRepository();
    const exported = JSON.parse(await exportLearningData(source)) as {
      settings: { feedbackSounds?: boolean };
    };
    delete exported.settings.feedbackSounds;
    const target = new InMemoryLearningRepository();

    await importLearningData(target, JSON.stringify(exported));

    expect((await target.load()).settings.feedbackSounds).toBe(true);
  });
});
