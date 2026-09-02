import type { KPatternData } from 'cubing/kpuzzle';

const FACE_CODES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;

const EDGES = [
  { name: 'UF', facelets: [7, 19] },
  { name: 'UR', facelets: [5, 10] },
  { name: 'UB', facelets: [1, 46] },
  { name: 'UL', facelets: [3, 37] },
  { name: 'DF', facelets: [28, 25] },
  { name: 'DR', facelets: [32, 16] },
  { name: 'DB', facelets: [34, 52] },
  { name: 'DL', facelets: [30, 43] },
  { name: 'FR', facelets: [23, 12] },
  { name: 'FL', facelets: [21, 41] },
  { name: 'BR', facelets: [48, 14] },
  { name: 'BL', facelets: [50, 39] },
] as const;

const CORNERS = [
  { name: 'UFR', facelets: [8, 20, 9] },
  { name: 'URB', facelets: [2, 11, 45] },
  { name: 'UBL', facelets: [0, 47, 36] },
  { name: 'ULF', facelets: [6, 38, 18] },
  { name: 'DRF', facelets: [29, 15, 26] },
  { name: 'DFL', facelets: [27, 24, 44] },
  { name: 'DLB', facelets: [33, 42, 53] },
  { name: 'DBR', facelets: [35, 51, 17] },
] as const;

export interface FaceletValidationSuccess {
  ok: true;
  patternData: KPatternData;
}

export interface FaceletValidationFailure {
  ok: false;
  message: string;
}

export type FaceletValidation = FaceletValidationSuccess | FaceletValidationFailure;

export interface CubeSolution {
  algorithm: string;
  moves: string[];
}

interface SolverWorkerResponse {
  ok: boolean;
  algorithm?: string;
  message?: string;
}

async function solvePattern(facelets: string): Promise<string> {
  if (typeof Worker === 'undefined') {
    const min2phase = await import('./min2phase');
    return min2phase.solvePattern(facelets);
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./cubeSolver.worker.ts', import.meta.url), {
      type: 'module',
    });
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error('Løsningen tog for lang tid. Prøv igen.'));
    }, 15_000);
    worker.onmessage = (event: MessageEvent<SolverWorkerResponse>) => {
      window.clearTimeout(timeout);
      worker.terminate();
      if (event.data.ok && typeof event.data.algorithm === 'string') {
        resolve(event.data.algorithm);
      } else {
        reject(new Error(event.data.message ?? 'Løsningen kunne ikke beregnes.'));
      }
    };
    worker.onerror = () => {
      window.clearTimeout(timeout);
      worker.terminate();
      reject(new Error('Browseren kunne ikke starte løsningsmotoren.'));
    };
    worker.postMessage(facelets);
  });
}

function rotateLeft(value: string, amount: number): string {
  return value.slice(amount) + value.slice(0, amount);
}

function permutationParity(pieces: number[]): number {
  let inversions = 0;
  for (let left = 0; left < pieces.length; left += 1) {
    for (let right = left + 1; right < pieces.length; right += 1) {
      if ((pieces[left] ?? 0) > (pieces[right] ?? 0)) inversions += 1;
    }
  }
  return inversions % 2;
}

function decodeOrbit(
  facelets: string,
  definitions: ReadonlyArray<{ name: string; facelets: readonly number[] }>
): { pieces: number[]; orientation: number[] } | null {
  const pieces: number[] = [];
  const orientation: number[] = [];
  for (const position of definitions) {
    const colors = position.facelets.map((index) => facelets[index]).join('');
    let matchingPiece = -1;
    let matchingOrientation = -1;
    for (let pieceIndex = 0; pieceIndex < definitions.length; pieceIndex += 1) {
      const piece = definitions[pieceIndex];
      if (!piece) continue;
      for (let amount = 0; amount < piece.name.length; amount += 1) {
        if (rotateLeft(piece.name, amount) === colors) {
          matchingPiece = pieceIndex;
          matchingOrientation = amount;
        }
      }
    }
    if (matchingPiece < 0 || matchingOrientation < 0) return null;
    pieces.push(matchingPiece);
    orientation.push(matchingOrientation);
  }
  if (new Set(pieces).size !== definitions.length) return null;
  return { pieces, orientation };
}

export function validateFacelets(facelets: string): FaceletValidation {
  if (
    facelets.length !== 54 ||
    [...facelets].some((color) => !FACE_CODES.includes(color as never))
  ) {
    return { ok: false, message: 'Tilstanden skal indeholde præcis 54 gyldige farvefelter.' };
  }
  const counts = Object.fromEntries(FACE_CODES.map((color) => [color, 0])) as Record<
    string,
    number
  >;
  for (const color of facelets) counts[color] = (counts[color] ?? 0) + 1;
  if (FACE_CODES.some((color) => counts[color] !== 9)) {
    return { ok: false, message: 'Der skal være præcis ni felter af hver farve.' };
  }
  if (FACE_CODES.some((color, index) => facelets[index * 9 + 4] !== color)) {
    return { ok: false, message: 'Et eller flere faste centerfelter har den forkerte farve.' };
  }

  const edges = decodeOrbit(facelets, EDGES);
  if (!edges) {
    return {
      ok: false,
      message: 'Mindst én kant har en farvekombination, der ikke findes på en fysisk cube.',
    };
  }
  const corners = decodeOrbit(facelets, CORNERS);
  if (!corners) {
    return {
      ok: false,
      message: 'Mindst ét hjørne har en farvekombination eller rækkefølge, der ikke kan eksistere.',
    };
  }
  if (edges.orientation.reduce((sum, value) => sum + value, 0) % 2 !== 0) {
    return {
      ok: false,
      message: 'Én kant ser ud til at være vendt alene. Kontrollér kantfelterne.',
    };
  }
  if (corners.orientation.reduce((sum, value) => sum + value, 0) % 3 !== 0) {
    return {
      ok: false,
      message: 'Et hjørne ser ud til at være drejet forkert. Kontrollér hjørnefelterne.',
    };
  }
  if (permutationParity(edges.pieces) !== permutationParity(corners.pieces)) {
    return {
      ok: false,
      message: 'To brikker ser ud til at være byttet. Kontrollér især de senest indtastede sider.',
    };
  }

  return {
    ok: true,
    patternData: {
      EDGES: edges,
      CORNERS: corners,
      CENTERS: {
        pieces: [0, 1, 2, 3, 4, 5],
        orientation: [0, 0, 0, 0, 0, 0],
        orientationMod: [1, 1, 1, 1, 1, 1],
      },
    },
  };
}

export async function solveFacelets(facelets: string): Promise<CubeSolution> {
  const validation = validateFacelets(facelets);
  if (!validation.ok) throw new Error(validation.message);

  const [{ KPattern }, { cube3x3x3 }] = await Promise.all([
    import('cubing/kpuzzle'),
    import('cubing/puzzles'),
  ]);
  const kpuzzle = await cube3x3x3.kpuzzle();
  const pattern = new KPattern(kpuzzle, validation.patternData);
  if (
    pattern.experimentalIsSolved({ ignorePuzzleOrientation: false, ignoreCenterOrientation: true })
  ) {
    return { algorithm: '', moves: [] };
  }
  const algorithmText = (await solvePattern(facelets)).trim().replace(/\s+/g, ' ');
  const solved = pattern.applyAlg(algorithmText);
  if (
    !solved.experimentalIsSolved({ ignorePuzzleOrientation: false, ignoreCenterOrientation: true })
  ) {
    throw new Error('Løsningen kunne ikke verificeres mod den indtastede tilstand.');
  }
  return {
    algorithm: algorithmText,
    moves: algorithmText.split(/\s+/).filter(Boolean),
  };
}

export function describeMove(move: string): string {
  const colorByFace: Record<string, string> = {
    U: 'hvide',
    R: 'røde',
    F: 'grønne',
    D: 'gule',
    L: 'orange',
    B: 'blå',
  };
  const face = colorByFace[move[0] ?? ''] ?? 'angivne';
  if (move.endsWith('2')) {
    return `Drej kun siden med det ${face} center en halv omgang (180°). Ved en halv omgang er retningen ligegyldig.`;
  }
  const direction = move.endsWith("'") ? 'mod uret' : 'med uret';
  return `Hold siden med det ${face} center direkte mod dig. Drej kun denne side en kvart omgang ${direction}, sådan som du ser den.`;
}
