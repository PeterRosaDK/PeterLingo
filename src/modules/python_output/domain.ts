import corpus from './answers.json';
import { recall, unit } from '../shared/recall';
import type { LearningUnit } from '../../learning/types';
export const pythonCorpus = corpus;
export const pythonUnits = corpus.snippets.map((s) => unit(s.id, 'python_output', s.topic, 45));
export function pythonExercise(u: LearningUnit) {
  const s = corpus.snippets.find((s) => `python_output:${s.id}` === u.id)!;
  return recall(
    u,
    `Hvad printer programmet? · Python ${corpus.pythonVersion}`,
    s.exception ?? s.stdout,
    s.explanation,
    {
      kind: 'python',
      code: s.code,
      parameters: {
        topic: s.topic,
        misconceptionTags: s.misconceptionTags,
        exception: s.exception,
        stdout: s.stdout,
        pythonVersion: corpus.pythonVersion,
      },
      hints: [
        { id: 'topic', label: 'Regelområde', content: s.topic },
        { id: 'rule', label: 'Forklaring', content: s.explanation, revealsAnswer: true },
      ],
    }
  );
}
// Preserve internal spaces and blank lines; a terminal newline is optional in the answer field.
export function outputMatches(actual: string, expected: string) {
  return actual.replace(/\r\n/g, '\n').replace(/\n$/, '') === expected.replace(/\n$/, '');
}
