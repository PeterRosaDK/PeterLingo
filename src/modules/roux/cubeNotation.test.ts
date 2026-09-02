import { describe, expect, it } from 'vitest';
import { notationExplanation } from './cubeNotation';

describe('cube notation labels', () => {
  it('expands the face letter independently of suffixes', () => {
    expect(notationExplanation("R'")).toBe('Right (højre) · laget på din højre hånd');
    expect(notationExplanation('B2')).toBe('Back (bag) · bagsiden væk fra dig');
    expect(notationExplanation('M')).toBe('Middle (midte) · det lodrette midterlag mellem L og R');
  });
});
