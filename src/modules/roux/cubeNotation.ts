export interface CubeNotationEntry {
  notation: string;
  english: string;
  danish: string;
  position: string;
}

export const OUTER_CUBE_NOTATION: readonly CubeNotationEntry[] = [
  { notation: 'U', english: 'Up', danish: 'op', position: 'toplaget' },
  { notation: 'R', english: 'Right', danish: 'højre', position: 'laget på din højre hånd' },
  { notation: 'F', english: 'Front', danish: 'foran', position: 'forsiden mod dig' },
  { notation: 'D', english: 'Down', danish: 'ned', position: 'bundlaget' },
  { notation: 'L', english: 'Left', danish: 'venstre', position: 'laget på din venstre hånd' },
  { notation: 'B', english: 'Back', danish: 'bag', position: 'bagsiden væk fra dig' },
] as const;

const MIDDLE_NOTATION: CubeNotationEntry = {
  notation: 'M',
  english: 'Middle',
  danish: 'midte',
  position: 'det lodrette midterlag mellem L og R',
};

export function notationExplanation(move: string): string {
  const code = move.trim()[0]?.toUpperCase();
  const entry =
    OUTER_CUBE_NOTATION.find((candidate) => candidate.notation === code) ??
    (code === 'M' ? MIDDLE_NOTATION : null);
  return entry ? `${entry.english} (${entry.danish}) · ${entry.position}` : 'ukendt notation';
}
