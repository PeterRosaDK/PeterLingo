import type { LearningStage } from './types';

export function learningStageLabel(stage: LearningStage | undefined): string {
  if (stage === 'teaching') return 'Under indlæring';
  if (stage === 'assisted') return 'Med støtte';
  if (stage === 'unassisted') return 'Uden hjælp';
  if (stage === 'fluent') return 'Flydende';
  return 'Nyt trin';
}
