import { describe, expect, it } from 'vitest';
import {
  BCS_STACK,
  bcsRankCalculation,
  cardAtOffset,
  cardAtPosition,
  cutSizeForTarget,
  cyclicOffset,
  forwardDistance,
  nextBcsCard,
  positionAfterCut,
  positionOfCard,
  previousBcsCard,
  topCardAfterRemoving,
} from './bcs';

describe('Breakthrough Card System', () => {
  it.each([
    ['1S', '3S'],
    ['3S', '7D'],
    ['7D', '5H'],
    ['2S', '5C'],
    ['13D', '4H'],
    ['6S', '13H'],
    ['3D', '10S'],
    ['11C', '12D'],
  ])('maps %s to %s', (current, next) => {
    expect(nextBcsCard(current as never)).toBe(next);
  });

  it('uses Osterlind’s two-stage value calculation', () => {
    expect(bcsRankCalculation('13D')).toEqual({
      doubled: 26,
      reducedDouble: 13,
      withSuitValue: 17,
      result: 4,
    });
  });

  it('generates the complete canonical cycle', () => {
    expect(BCS_STACK).toHaveLength(52);
    expect(new Set(BCS_STACK).size).toBe(52);
    expect(BCS_STACK[0]).toBe('1S');
    expect(BCS_STACK[51]).toBe('13S');
    expect(nextBcsCard('13S')).toBe('1S');
  });

  it('keeps card and position directions separate', () => {
    expect(cardAtPosition(23)).toBe(BCS_STACK[22]);
    expect(positionOfCard(cardAtPosition(23))).toBe(23);
    expect(BCS_STACK.every((card, index) => positionOfCard(card) === index + 1)).toBe(true);
  });

  it('supports cyclic stack arithmetic', () => {
    expect(cyclicOffset(52, 1)).toBe(1);
    expect(cyclicOffset(1, -1)).toBe(52);
    expect(cardAtOffset('13S', 1)).toBe('1S');
    expect(previousBcsCard('1S')).toBe('13S');
    expect(forwardDistance('13S', '3S')).toBe(2);
  });

  it('tracks positions after moving a top packet to the bottom', () => {
    expect(positionAfterCut(23, 7)).toBe(16);
    expect(positionAfterCut(4, 7)).toBe(49);
    expect(cutSizeForTarget(23, 10)).toBe(13);
    expect(positionAfterCut(23, cutSizeForTarget(23, 10))).toBe(10);
  });

  it('finds the new top card after cards are removed rather than cut', () => {
    expect(topCardAfterRemoving(0)).toBe('1S');
    expect(topCardAfterRemoving(3)).toBe(BCS_STACK[3]);
    expect(() => topCardAfterRemoving(52)).toThrow('0–51');
  });
});
