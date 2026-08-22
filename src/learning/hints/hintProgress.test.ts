import { describe, expect, it } from 'vitest';
import { createHintProgress, revealNextHint } from './hintProgress';

const hints = [
  { id: 'gentle', label: 'Lille hint', content: 'Tænk på ankret.' },
  { id: 'answer', label: 'Vis svar', content: 'Søndag', revealsAnswer: true },
];

describe('progressive hints', () => {
  it('starts without using a hint', () => {
    expect(createHintProgress(hints)).toMatchObject({
      used: 0,
      answerRevealed: false,
      hasMore: true,
    });
  });

  it('accounts for hints and final reveal separately', () => {
    const first = revealNextHint(hints, createHintProgress(hints));
    const second = revealNextHint(hints, first);
    expect(first).toMatchObject({ used: 1, answerRevealed: false });
    expect(second).toMatchObject({ used: 2, answerRevealed: true, hasMore: false });
  });
});
