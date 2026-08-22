import type { ProgressiveHint } from '../types';

export interface HintProgress {
  visible: ProgressiveHint[];
  used: number;
  answerRevealed: boolean;
  hasMore: boolean;
}

export function createHintProgress(hints: ProgressiveHint[]): HintProgress {
  return { visible: [], used: 0, answerRevealed: false, hasMore: hints.length > 0 };
}

export function revealNextHint(hints: ProgressiveHint[], progress: HintProgress): HintProgress {
  if (!progress.hasMore) return progress;
  const next = hints[progress.used];
  if (!next) return { ...progress, hasMore: false };
  const used = progress.used + 1;
  return {
    visible: [...progress.visible, next],
    used,
    answerRevealed: progress.answerRevealed || next.revealsAnswer === true,
    hasMore: used < hints.length,
  };
}
