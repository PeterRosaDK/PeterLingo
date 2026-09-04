import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DataProvider } from '../../app/DataProvider';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import { InMemoryLearningRepository } from '../../persistence/inMemoryRepository';
import { RouxFirstBlockPage } from './RouxFirstBlockPage';

vi.mock('../../hardware/smartcube/physicalCube', async () => {
  const { MockSmartCubeAdapter: MockAdapter } =
    await import('../../hardware/smartcube/MockSmartCubeAdapter');
  return { physicalCubeAdapter: new MockAdapter() };
});

vi.mock('./CubeViewer', () => ({
  CubeViewer: ({ ariaLabel }: { ariaLabel?: string }) => (
    <div aria-label={ariaLabel ?? 'Interaktiv 3D Rubiks terning'} />
  ),
}));

vi.mock('./LivePhysicalCubeViewer', () => ({
  LivePhysicalCubeViewer: () => <div aria-label="Din fysiske cube i 3D" />,
}));

const SCRAMBLED_FACELETS = 'RFFLUBDBDBRDRRUUFFRDLFFFBBLUUFRDLLBRUDBULUDDLRDBLBRULF';

function renderPage(cube: MockSmartCubeAdapter, repository: InMemoryLearningRepository) {
  return render(
    <DataProvider repository={repository}>
      <MemoryRouter>
        <RouxFirstBlockPage cubeAdapter={cube} />
      </MemoryRouter>
    </DataProvider>
  );
}

describe('Roux First Block course', () => {
  it('teaches the two subgoals and records a manual practice attempt', async () => {
    const repository = new InMemoryLearningRepository();
    renderPage(new MockSmartCubeAdapter(SCRAMBLED_FACELETS), repository);

    expect(screen.getByRole('heading', { name: 'First Block', level: 1 })).toBeVisible();
    expect(screen.getByLabelText('Din fysiske cube i 3D')).toBeVisible();
    expect(screen.getByLabelText('Delmål i 3D: Forreste firkant')).toBeVisible();
    fireEvent.click(screen.getByRole('tab', { name: /Hele First Block/ }));
    expect(screen.getByLabelText('Delmål i 3D: Hele First Block')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Start uden GoCube' }));
    fireEvent.click(screen.getByRole('button', { name: 'Min First Block er samlet' }));

    await screen.findByText('First Block gennemført');
    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.attempts.at(-1)).toMatchObject({
        learningUnitId: 'roux:first-block-live',
        generatedParameters: { mode: 'self-reported', verifiedByCube: false },
      });
    });
  });

  it('finishes automatically when the connected GoCube reports the completed block', async () => {
    const repository = new InMemoryLearningRepository();
    const cube = new MockSmartCubeAdapter(SCRAMBLED_FACELETS);
    await cube.connect();
    renderPage(cube, repository);

    fireEvent.click(await screen.findByRole('button', { name: 'Start med live GoCube' }));
    await act(async () => cube.setFacelets(SOLVED_FACELETS));

    await screen.findByText('GoCube har genkendt alle fem målbrikker. Din First Block er færdig.');
    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.attempts.at(-1)).toMatchObject({
        learningUnitId: 'roux:first-block-live',
        generatedParameters: { mode: 'live-gocube', verifiedByCube: true },
      });
    });
  });
});
