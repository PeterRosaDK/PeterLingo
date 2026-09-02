import type { CubeMove, CubeState } from './types';

export const SOLVED_FACELETS = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';

export type FixedFirstBlockPieceId =
  | 'front-corner'
  | 'front-edge'
  | 'bottom-edge'
  | 'back-corner'
  | 'back-edge';

export interface FixedFirstBlockProgress {
  valid: boolean;
  solvedPieceIds: FixedFirstBlockPieceId[];
  frontSquareComplete: boolean;
  complete: boolean;
}

const FIXED_LEFT_FIRST_BLOCK_PIECES: ReadonlyArray<{
  id: FixedFirstBlockPieceId;
  stickers: ReadonlyArray<[number, 'D' | 'L' | 'F' | 'B']>;
}> = [
  {
    id: 'front-corner',
    stickers: [
      [27, 'D'],
      [44, 'L'],
      [24, 'F'],
    ],
  },
  {
    id: 'front-edge',
    stickers: [
      [21, 'F'],
      [41, 'L'],
    ],
  },
  {
    id: 'bottom-edge',
    stickers: [
      [30, 'D'],
      [43, 'L'],
    ],
  },
  {
    id: 'back-corner',
    stickers: [
      [33, 'D'],
      [53, 'B'],
      [42, 'L'],
    ],
  },
  {
    id: 'back-edge',
    stickers: [
      [50, 'B'],
      [39, 'L'],
    ],
  },
];

export function appendMove(state: CubeState, move: CubeMove): CubeState {
  return {
    ...state,
    algorithm: [state.algorithm, move.notation].filter(Boolean).join(' '),
    moveCount: state.moveCount + 1,
    synchronization: state.facelets ? state.synchronization : 'moves-only',
  };
}

export function fixedLeftFirstBlockProgress(facelets: string): FixedFirstBlockProgress {
  if (facelets.length !== 54) {
    return { valid: false, solvedPieceIds: [], frontSquareComplete: false, complete: false };
  }
  const allCenters = [4, 13, 22, 31, 40, 49].map((index) => facelets[index]);
  if (allCenters.some((color) => color === undefined) || new Set(allCenters).size !== 6) {
    return { valid: false, solvedPieceIds: [], frontSquareComplete: false, complete: false };
  }
  const centers = { D: facelets[31], L: facelets[40], F: facelets[22], B: facelets[49] };
  if (Object.values(centers).some((color) => color === undefined)) {
    return { valid: false, solvedPieceIds: [], frontSquareComplete: false, complete: false };
  }
  const solvedPieceIds = FIXED_LEFT_FIRST_BLOCK_PIECES.filter((piece) =>
    piece.stickers.every(([index, face]) => facelets[index] === centers[face])
  ).map((piece) => piece.id);
  const frontSquareComplete = ['front-corner', 'front-edge', 'bottom-edge'].every((id) =>
    solvedPieceIds.includes(id as FixedFirstBlockPieceId)
  );
  return {
    valid: true,
    solvedPieceIds,
    frontSquareComplete,
    complete: solvedPieceIds.length === FIXED_LEFT_FIRST_BLOCK_PIECES.length,
  };
}

export function isFixedLeftFirstBlockSolved(facelets: string): boolean {
  return fixedLeftFirstBlockProgress(facelets).complete;
}
