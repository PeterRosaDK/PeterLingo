import { describe, expect, it } from 'vitest';
import { notationExplanation } from './cubeNotation';

describe('cube notation labels', () => {
  it('expands the face letter independently of suffixes', () => {
    expect(notationExplanation("R'")).toBe('Right (højre) · laget med rødt center');
    expect(notationExplanation('B2')).toBe('Back (bag) · laget med blåt center');
    expect(notationExplanation('M')).toBe('Middle (midte) · midterlaget mellem L og R');
  });
});
