import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataProvider } from '../../app/DataProvider';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import { InMemoryLearningRepository } from '../../persistence/inMemoryRepository';
import { RouxCmllPage } from './RouxCmllPage';

vi.mock('../../hardware/smartcube/physicalCube', async () => {
  const { MockSmartCubeAdapter: MockAdapter } =
    await import('../../hardware/smartcube/MockSmartCubeAdapter');
  return { physicalCubeAdapter: new MockAdapter() };
});

afterEach(cleanup);

const SUNE_SETUP_FACELETS = 'RUFUUUUULBBURRRRRRBFUFFFFFFDDDDDDDDDFRRLLLLLLLLUBBBBBB';

function renderPage(cube: MockSmartCubeAdapter, repository: InMemoryLearningRepository) {
  return render(
    <DataProvider repository={repository}>
      <MemoryRouter>
        <RouxCmllPage cubeAdapter={cube} />
      </MemoryRouter>
    </DataProvider>
  );
}

describe('Roux beginner CMLL course', () => {
  it('teaches white-up two-look CMLL with exactly two algorithms', async () => {
    const repository = new InMemoryLearningRepository();
    renderPage(new MockSmartCubeAdapter(SUNE_SETUP_FACELETS), repository);

    expect(screen.getByRole('heading', { name: 'Begynder-CMLL', level: 1 })).toBeVisible();
    expect(screen.getByText(/hvid CMLL-farven/)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Næste kig' }));
    expect(screen.getByText('Orientér')).toBeVisible();
    expect(screen.getByText('Permutér')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Næste kig' }));
    const sune = screen
      .getByText('Algoritme 1 · Sune')
      .closest<HTMLElement>('.cmll-algorithm-card');
    expect(sune).not.toBeNull();
    expect(within(sune!).getByText('R U R′ U R U2 R′')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Næste kig' }));
    expect(screen.getByText('Forlygter til venstre')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Næste kig' }));
    const tPerm = screen
      .getByText('Algoritme 2 · T-perm')
      .closest<HTMLElement>('.cmll-algorithm-card');
    expect(tPerm).not.toBeNull();
    expect(within(tPerm!).getByText(/R U R′ U′ R′ F R2/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Jeg er klar til CMLL' }));

    fireEvent.click(screen.getByRole('button', { name: 'Start uden GoCube' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mine fire hjørner er løst' }));
    await screen.findByText('CMLL gennemført');
    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.attempts.at(-1)).toMatchObject({
        learningUnitId: 'roux:cmll-live',
        generatedParameters: {
          mode: 'self-reported',
          verifiedByCube: false,
          algorithmCount: 2,
        },
      });
    });
  });

  it('uses live corners and refuses completion while a block is broken', async () => {
    const repository = new InMemoryLearningRepository();
    const cube = new MockSmartCubeAdapter(SUNE_SETUP_FACELETS);
    await cube.connect();
    renderPage(cube, repository);

    fireEvent.click(await screen.findByRole('button', { name: 'Start CMLL med GoCube' }));
    expect(screen.getByText('1/4 orienteret')).toBeVisible();

    const brokenBlock = [...SOLVED_FACELETS];
    brokenBlock[29] = 'X';
    await act(async () => cube.setFacelets(brokenBlock.join('')));
    expect(await screen.findByText(/en af de to blokke er brudt/)).toBeVisible();
    expect(screen.queryByText('CMLL gennemført')).not.toBeInTheDocument();

    await act(async () => cube.setFacelets(SOLVED_FACELETS));
    expect(await screen.findByText('CMLL gennemført')).toBeVisible();
    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.attempts.at(-1)).toMatchObject({
        learningUnitId: 'roux:cmll-live',
        generatedParameters: { mode: 'live-gocube', verifiedByCube: true },
      });
    });
  });
});
