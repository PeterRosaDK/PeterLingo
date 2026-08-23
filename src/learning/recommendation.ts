export type RecommendationReason = 'due-review' | 'next-new' | 'weakest';

export const recommendationReasonLabels: Record<RecommendationReason, string> = {
  'due-review': 'Trinnet er klar til repetition nu.',
  'next-new': 'Det er det næste nye trin i læringsrækkefølgen.',
  weakest: 'Det er dit mindst sikre af de trin, du allerede har mødt.',
};
