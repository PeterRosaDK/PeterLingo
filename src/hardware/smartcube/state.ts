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

export type FixedSecondBlockPieceId = FixedFirstBlockPieceId;

export interface FixedSecondBlockProgress {
  valid: boolean;
  firstBlockComplete: boolean;
  solvedPieceIds: FixedSecondBlockPieceId[];
  bottomEdgeComplete: boolean;
  frontSquareComplete: boolean;
  backSquareComplete: boolean;
  oneSquareComplete: boolean;
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

const FIXED_RIGHT_SECOND_BLOCK_PIECES: ReadonlyArray<{
  id: FixedSecondBlockPieceId;
  stickers: ReadonlyArray<[number, 'D' | 'R' | 'F' | 'B']>;
}> = [
  {
    id: 'front-corner',
    stickers: [
      [29, 'D'],
      [15, 'R'],
      [26, 'F'],
    ],
  },
  {
    id: 'front-edge',
    stickers: [
      [23, 'F'],
      [12, 'R'],
    ],
  },
  {
    id: 'bottom-edge',
    stickers: [
      [32, 'D'],
      [16, 'R'],
    ],
  },
  {
    id: 'back-corner',
    stickers: [
      [35, 'D'],
      [51, 'B'],
      [17, 'R'],
    ],
  },
  {
    id: 'back-edge',
    stickers: [
      [48, 'B'],
      [14, 'R'],
    ],
  },
];

function hasUsableCenters(facelets: string): boolean {
  if (facelets.length !== 54) return false;
  const centers = [4, 13, 22, 31, 40, 49].map((index) => facelets[index]);
  return centers.every((color) => color !== undefined) && new Set(centers).size === 6;
}

export function appendMove(state: CubeState, move: CubeMove): CubeState {
  return {
    ...state,
    algorithm: [state.algorithm, move.notation].filter(Boolean).join(' '),
    moveCount: state.moveCount + 1,
    synchronization: state.facelets ? state.synchronization : 'moves-only',
  };
}

export function fixedLeftFirstBlockProgress(facelets: string): FixedFirstBlockProgress {
  if (!hasUsableCenters(facelets)) {
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

export function fixedRightSecondBlockProgress(facelets: string): FixedSecondBlockProgress {
  const empty: FixedSecondBlockProgress = {
    valid: false,
    firstBlockComplete: false,
    solvedPieceIds: [],
    bottomEdgeComplete: false,
    frontSquareComplete: false,
    backSquareComplete: false,
    oneSquareComplete: false,
    complete: false,
  };
  if (!hasUsableCenters(facelets)) return empty;

  const centers = { D: facelets[31], R: facelets[13], F: facelets[22], B: facelets[49] };
  if (Object.values(centers).some((color) => color === undefined)) return empty;

  const solvedPieceIds = FIXED_RIGHT_SECOND_BLOCK_PIECES.filter((piece) =>
    piece.stickers.every(([index, face]) => facelets[index] === centers[face])
  ).map((piece) => piece.id);
  const contains = (...ids: FixedSecondBlockPieceId[]) =>
    ids.every((id) => solvedPieceIds.includes(id));
  const bottomEdgeComplete = contains('bottom-edge');
  const frontSquareComplete = contains('bottom-edge', 'front-corner', 'front-edge');
  const backSquareComplete = contains('bottom-edge', 'back-corner', 'back-edge');
  const firstBlockComplete = fixedLeftFirstBlockProgress(facelets).complete;
  const complete =
    firstBlockComplete && solvedPieceIds.length === FIXED_RIGHT_SECOND_BLOCK_PIECES.length;

  return {
    valid: true,
    firstBlockComplete,
    solvedPieceIds,
    bottomEdgeComplete,
    frontSquareComplete,
    backSquareComplete,
    oneSquareComplete: frontSquareComplete || backSquareComplete,
    complete,
  };
}

export function isFixedRightSecondBlockSolved(facelets: string): boolean {
  return fixedRightSecondBlockProgress(facelets).complete;
}
