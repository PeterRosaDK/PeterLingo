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

export type FixedCmllCornerId = 'front-right' | 'back-right' | 'back-left' | 'front-left';
export type FixedCmllHeadlightFace = 'F' | 'R' | 'B' | 'L';

export interface FixedCmllProgress {
  valid: boolean;
  blocksComplete: boolean;
  orientedCornerCount: number;
  orientedCornerIds: FixedCmllCornerId[];
  cornersOriented: boolean;
  headlightFaces: FixedCmllHeadlightFace[];
  solvedCornerIds: FixedCmllCornerId[];
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

const FIXED_CMLL_CORNERS: ReadonlyArray<{
  id: FixedCmllCornerId;
  stickers: ReadonlyArray<[number, 'U' | 'R' | 'F' | 'L' | 'B']>;
}> = [
  {
    id: 'front-right',
    stickers: [
      [8, 'U'],
      [20, 'F'],
      [9, 'R'],
    ],
  },
  {
    id: 'back-right',
    stickers: [
      [2, 'U'],
      [11, 'R'],
      [45, 'B'],
    ],
  },
  {
    id: 'back-left',
    stickers: [
      [0, 'U'],
      [47, 'B'],
      [36, 'L'],
    ],
  },
  {
    id: 'front-left',
    stickers: [
      [6, 'U'],
      [38, 'L'],
      [18, 'F'],
    ],
  },
];

const FIXED_CMLL_HEADLIGHTS: ReadonlyArray<{
  face: FixedCmllHeadlightFace;
  indices: readonly [number, number];
}> = [
  { face: 'F', indices: [18, 20] },
  { face: 'R', indices: [9, 11] },
  { face: 'B', indices: [45, 47] },
  { face: 'L', indices: [36, 38] },
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

export function fixedCmllProgress(facelets: string): FixedCmllProgress {
  const empty: FixedCmllProgress = {
    valid: false,
    blocksComplete: false,
    orientedCornerCount: 0,
    orientedCornerIds: [],
    cornersOriented: false,
    headlightFaces: [],
    solvedCornerIds: [],
    complete: false,
  };
  if (!hasUsableCenters(facelets)) return empty;

  const centers = {
    U: facelets[4],
    R: facelets[13],
    F: facelets[22],
    L: facelets[40],
    B: facelets[49],
  };
  if (Object.values(centers).some((color) => color === undefined)) return empty;

  const orientedCornerIds = FIXED_CMLL_CORNERS.filter(
    ({ stickers }) => facelets[stickers[0]![0]] === centers.U
  ).map(({ id }) => id);
  const orientedCornerCount = orientedCornerIds.length;
  const headlightFaces = FIXED_CMLL_HEADLIGHTS.filter(
    ({ indices }) => facelets[indices[0]] === facelets[indices[1]]
  ).map(({ face }) => face);
  const solvedCornerIds = FIXED_CMLL_CORNERS.filter((corner) =>
    corner.stickers.every(([index, face]) => facelets[index] === centers[face])
  ).map(({ id }) => id);
  const blocksComplete = fixedRightSecondBlockProgress(facelets).complete;

  return {
    valid: true,
    blocksComplete,
    orientedCornerCount,
    orientedCornerIds,
    cornersOriented: orientedCornerCount === FIXED_CMLL_CORNERS.length,
    headlightFaces,
    solvedCornerIds,
    complete: blocksComplete && solvedCornerIds.length === FIXED_CMLL_CORNERS.length,
  };
}

export function isFixedCmllSolved(facelets: string): boolean {
  return fixedCmllProgress(facelets).complete;
}
