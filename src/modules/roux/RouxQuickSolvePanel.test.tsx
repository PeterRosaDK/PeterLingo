import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import { RouxQuickSolvePanel } from './RouxQuickSolvePanel';

vi.mock('./faceletSolver', () => ({
  validateFacelets: () => ({ ok: true, message: '' }),
  solveFacelets: vi.fn(async () => ({ algorithm: "R U'", moves: ['R', "U'"] })),
  describeMove: (move: string) => `Forklaring af ${move}`,
}));

describe('Roux quick solve panel', () => {
  it('opens on the current state and advances from live cube moves', async () => {
    const cube = new MockSmartCubeAdapter(SOLVED_FACELETS);
    await cube.connect();
    render(<RouxQuickSolvePanel adapter={cube} onClose={() => undefined} />);

    await screen.findByText('Forklaring af R');
    expect(screen.getByText('Notation: R')).toBeVisible();

    await act(async () => cube.emitMove('R'));
    expect(screen.getByText("Notation: U'")).toBeVisible();

    await act(async () => cube.emitMove("U'"));
    expect(screen.getByText('Cuben er løst')).toBeVisible();
  });
});
