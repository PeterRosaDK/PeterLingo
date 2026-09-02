export interface CubeNotationEntry {
  notation: string;
  english: string;
  danish: string;
  layer: string;
}

export const OUTER_CUBE_NOTATION: readonly CubeNotationEntry[] = [
  { notation: 'U', english: 'Up', danish: 'op', layer: 'laget med hvidt center' },
  { notation: 'R', english: 'Right', danish: 'højre', layer: 'laget med rødt center' },
  { notation: 'F', english: 'Front', danish: 'foran', layer: 'laget med grønt center' },
  { notation: 'D', english: 'Down', danish: 'ned', layer: 'laget med gult center' },
  { notation: 'L', english: 'Left', danish: 'venstre', layer: 'laget med orange center' },
  { notation: 'B', english: 'Back', danish: 'bag', layer: 'laget med blåt center' },
] as const;

const MIDDLE_NOTATION: CubeNotationEntry = {
  notation: 'M',
  english: 'Middle',
  danish: 'midte',
  layer: 'midterlaget mellem L og R',
};

export function notationExplanation(move: string): string {
  const code = move.trim()[0]?.toUpperCase();
  const entry =
    OUTER_CUBE_NOTATION.find((candidate) => candidate.notation === code) ??
    (code === 'M' ? MIDDLE_NOTATION : null);
  return entry ? `${entry.english} (${entry.danish}) · ${entry.layer}` : 'ukendt notation';
}
