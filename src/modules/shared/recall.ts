import type { GeneratedExercise, LearningUnit } from '../../learning/types';
export interface RecallExercise extends GeneratedExercise {
  answer: string;
  accepted?: string[];
  explanation: string;
  kind?: 'text' | 'grid' | 'morse-receive' | 'morse-send' | 'ipa' | 'spectrogram' | 'python';
  media?: string;
  code?: string;
}
export function normalize(value: string): string {
  return value.normalize('NFC').trim().toLocaleLowerCase('da').replace(/\s+/g, ' ');
}
export function unit(
  id: string,
  discipline: LearningUnit['discipline'],
  title: string,
  seconds = 30
): LearningUnit {
  return {
    id: `${discipline}:${id}`,
    discipline,
    title,
    stage: 'teaching',
    estimatedSeconds: seconds,
    isNew: true,
  };
}
export function recall(
  u: LearningUnit,
  prompt: string,
  answer: string,
  explanation: string,
  extras: Partial<RecallExercise> = {}
): RecallExercise {
  return {
    id: crypto.randomUUID(),
    learningUnitId: u.id,
    discipline: u.discipline,
    prompt,
    answer,
    explanation,
    parameters: { answer },
    hints: [
      { id: 'rule', label: 'Tænk sådan', content: explanation },
      { id: 'answer', label: 'Facit', content: answer, revealsAnswer: true },
    ],
    ...extras,
  };
}
