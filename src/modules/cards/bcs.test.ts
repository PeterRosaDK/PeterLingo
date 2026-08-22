import { describe, expect, it } from 'vitest';
import { BCS_STACK, cardAtPosition, cyclicOffset, nextBcsCard, positionOfCard } from './bcs';

describe('Breakthrough Card System', () => {
  it.each([
    ['1S', '3S'],
    ['3S', '7D'],
    ['7D', '5H'],
    ['6H', '1H'],
  ])('maps %s to %s', (current, next) => {
    expect(nextBcsCard(current as never)).toBe(next);
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
  });

  it('supports cyclic stack arithmetic', () => {
    expect(cyclicOffset(52, 1)).toBe(1);
    expect(cyclicOffset(1, -1)).toBe(52);
  });
});
