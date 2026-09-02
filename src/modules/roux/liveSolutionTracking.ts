export interface PendingHalfTurn {
  expected: string;
  firstQuarter: string;
}

export type LiveMoveResult =
  | { status: 'matched'; pending: null }
  | { status: 'halfway'; pending: PendingHalfTurn }
  | { status: 'cancelled'; pending: null }
  | { status: 'mismatch'; pending: null };

function normalize(move: string): string {
  return move.trim().replace('′', "'");
}

function face(move: string): string {
  return normalize(move)[0] ?? '';
}

export function consumeLiveMove(
  expectedMove: string,
  receivedMove: string,
  pending: PendingHalfTurn | null
): LiveMoveResult {
  const expected = normalize(expectedMove);
  const received = normalize(receivedMove);

  if (!expected.endsWith('2')) {
    return received === expected
      ? { status: 'matched', pending: null }
      : { status: 'mismatch', pending: null };
  }

  if (received === expected) return { status: 'matched', pending: null };
  if (face(received) !== face(expected) || received.endsWith('2')) {
    return { status: 'mismatch', pending: null };
  }
  if (!pending || pending.expected !== expected) {
    return {
      status: 'halfway',
      pending: { expected, firstQuarter: received },
    };
  }
  if (received === pending.firstQuarter) return { status: 'matched', pending: null };

  // A quarter-turn followed by its inverse returns to the starting state.
  return { status: 'cancelled', pending: null };
}
