import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import { RouxQuickSolvePanel } from './RouxQuickSolvePanel';

vi.mock('./faceletSolver', () => ({
  validateFacelets: () => ({ ok: true, message: '' }),
  solveFacelets: vi.fn(async () => ({ algorithm: "R U'", moves: ['R', "U'"] })),
  describeMove: (move: string) => `Forklaring af ${move}`,
}));

afterEach(cleanup);

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

  it('continues from a solved cube into the selected phase setup', async () => {
    const cube = new MockSmartCubeAdapter(SOLVED_FACELETS);
    render(
      <RouxQuickSolvePanel
        adapter={cube}
        onClose={() => undefined}
        target={{
          phaseName: 'Second Block',
          setupAlgorithm: "U R'",
          readyMessage: 'First Block er bevaret.',
        }}
      />
    );

    expect(await screen.findByText('Gør cuben klar til Second Block')).toBeVisible();
    expect(await screen.findByText(/2 træk løser cuben/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Jeg har lavet trækket' }));
    fireEvent.click(screen.getByRole('button', { name: 'Jeg har lavet trækket' }));
    expect(screen.getByText('Klargør Second Block · træk 1 af 2')).toBeVisible();
  });
});
