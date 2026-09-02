import { describe, expect, it } from 'vitest';
import { describeMove, solveFacelets, validateFacelets } from './faceletSolver';

const SOLVED = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
const PETER_STATE = 'RFFLUBDBDBRDRRUUFFRDLFFFBBLUUFRDLLBRUDBULUDDLRDBLBRULF';

describe('facelet solver', () => {
  it("accepts a solved cube and Peter's manually entered physical state", () => {
    expect(validateFacelets(SOLVED).ok).toBe(true);
    expect(validateFacelets(PETER_STATE).ok).toBe(true);
  });

  it('rejects impossible counts and isolated twists', () => {
    expect(validateFacelets(`R${SOLVED.slice(1)}`)).toMatchObject({ ok: false });
    const twistedCorner = [...SOLVED];
    [twistedCorner[8], twistedCorner[20], twistedCorner[9]] = [
      twistedCorner[9]!,
      twistedCorner[8]!,
      twistedCorner[20]!,
    ];
    expect(validateFacelets(twistedCorner.join(''))).toMatchObject({
      ok: false,
      message: expect.stringContaining('hjørne'),
    });
  });

  it("solves and verifies Peter's manually entered physical state", async () => {
    const solution = await solveFacelets(PETER_STATE);
    expect(solution.moves.length).toBeGreaterThan(0);
    expect(solution.algorithm).toBe(solution.moves.join(' '));
  }, 20_000);

  it('describes notation with center colors and human directions', () => {
    expect(describeMove("R'")).toBe(
      'Hold siden med det røde center direkte mod dig. Drej kun denne side en kvart omgang mod uret, sådan som du ser den.'
    );
    expect(describeMove('U2')).toBe(
      'Drej kun siden med det hvide center en halv omgang (180°). Ved en halv omgang er retningen ligegyldig.'
    );
  });
});
