import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataProvider } from '../../app/DataProvider';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import { InMemoryLearningRepository } from '../../persistence/inMemoryRepository';
import { RouxSecondBlockPage } from './RouxSecondBlockPage';

vi.mock('../../hardware/smartcube/physicalCube', async () => {
  const { MockSmartCubeAdapter: MockAdapter } =
    await import('../../hardware/smartcube/MockSmartCubeAdapter');
  return { physicalCubeAdapter: new MockAdapter() };
});

afterEach(cleanup);

// Solved cube after the first standard-notation setup shown by the course.
const FIRST_BLOCK_ONLY_FACELETS = 'UURUUFBBFRRDBRRURRURDFFUFFFDDRDDDDDBFFLLLLLLLBLLUBBUBB';

function renderPage(cube: MockSmartCubeAdapter, repository: InMemoryLearningRepository) {
  return render(
    <DataProvider repository={repository}>
      <MemoryRouter>
        <RouxSecondBlockPage cubeAdapter={cube} />
      </MemoryRouter>
    </DataProvider>
  );
}

describe('Roux Second Block course', () => {
  it('keeps fixed beginner colors and exposes only two starter tools', async () => {
    const repository = new InMemoryLearningRepository();
    renderPage(new MockSmartCubeAdapter(FIRST_BLOCK_ONLY_FACELETS), repository);

    expect(screen.getByRole('heading', { name: 'Second Block', level: 1 })).toBeVisible();
    expect(screen.getByText('Rød til højre · gul i bunden')).toBeVisible();
    for (let step = 0; step < 4; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Næste delmål' }));
    }
    const tools = screen.getByText('Værktøj A').closest<HTMLElement>('.beginner-trigger-grid');
    expect(tools).not.toBeNull();
    expect(within(tools!).getByText('R U R′')).toBeVisible();
    expect(within(tools!).getByText('R U′ R′')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Jeg er klar til Second Block' }));

    fireEvent.click(screen.getByRole('button', { name: 'Start uden GoCube' }));
    fireEvent.click(screen.getByRole('button', { name: 'Begge blokke er samlet' }));
    await screen.findByText('Second Block gennemført');
    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.attempts.at(-1)).toMatchObject({
        learningUnitId: 'roux:second-block-live',
        generatedParameters: {
          mode: 'self-reported',
          verifiedByCube: false,
          firstBlockRequired: true,
        },
      });
    });
  });

  it('requires First Block and completes live only when both blocks are recognized', async () => {
    const repository = new InMemoryLearningRepository();
    const cube = new MockSmartCubeAdapter(FIRST_BLOCK_ONLY_FACELETS);
    await cube.connect();
    renderPage(cube, repository);

    expect((await screen.findAllByText('Orange First Block'))[0]).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Start Second Block med GoCube' }));

    const brokenFirstBlock = [...SOLVED_FACELETS];
    brokenFirstBlock[27] = 'X';
    await act(async () => cube.setFacelets(brokenFirstBlock.join('')));
    expect(await screen.findByText(/First Block er brudt/)).toBeVisible();
    expect(screen.queryByText('Second Block gennemført')).not.toBeInTheDocument();

    await act(async () => cube.setFacelets(SOLVED_FACELETS));
    expect(await screen.findByText('Second Block gennemført')).toBeVisible();
    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.attempts.at(-1)).toMatchObject({
        learningUnitId: 'roux:second-block-live',
        generatedParameters: { mode: 'live-gocube', verifiedByCube: true },
      });
    });
  });
});
