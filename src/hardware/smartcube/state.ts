import type { CubeMove, CubeState } from './types';

export const SOLVED_FACELETS = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

export function appendMove(state: CubeState, move: CubeMove): CubeState {
  return {
    ...state,
    algorithm: [state.algorithm, move.notation].filter(Boolean).join(' '),
    moveCount: state.moveCount + 1,
    synchronization: state.facelets ? state.synchronization : 'moves-only',
  };
}

export function isFixedLeftFirstBlockSolved(facelets: string): boolean {
  if (facelets.length !== 54) return false;
  const centers = { D: facelets[31], L: facelets[40], F: facelets[22], B: facelets[49] };
  if (Object.values(centers).some((color) => color === undefined)) return false;
  const expected: Array<[number, keyof typeof centers]> = [
    [27, 'D'],
    [44, 'L'],
    [24, 'F'],
    [33, 'D'],
    [53, 'B'],
    [42, 'L'],
    [30, 'D'],
    [43, 'L'],
    [21, 'F'],
    [41, 'L'],
    [50, 'B'],
    [39, 'L'],
  ];
  return expected.every(([index, face]) => facelets[index] === centers[face]);
}
