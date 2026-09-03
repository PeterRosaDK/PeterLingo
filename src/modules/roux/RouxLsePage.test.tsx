import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataProvider } from '../../app/DataProvider';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import { InMemoryLearningRepository } from '../../persistence/inMemoryRepository';
import { RouxLsePage } from './RouxLsePage';

vi.mock('../../hardware/smartcube/physicalCube', async () => {
  const { MockSmartCubeAdapter: MockAdapter } =
    await import('../../hardware/smartcube/MockSmartCubeAdapter');
  return { physicalCubeAdapter: new MockAdapter() };
});

afterEach(cleanup);

const LSE_EO_SETUP_FACELETS = 'UUUFUFURUFDFRRRRRRLULFFFFUFDLDDDDDDDBUBLLLLLLRBRBBBBBB';

function renderPage(cube: MockSmartCubeAdapter, repository: InMemoryLearningRepository) {
  return render(
    <DataProvider repository={repository}>
      <MemoryRouter>
        <RouxLsePage cubeAdapter={cube} />
      </MemoryRouter>
    </DataProvider>
  );
}

describe('Roux beginner LSE course', () => {
  it('teaches three subgoals with two reusable M/U patterns', async () => {
    const repository = new InMemoryLearningRepository();
    renderPage(new MockSmartCubeAdapter(LSE_EO_SETUP_FACELETS), repository);

    expect(screen.getByRole('heading', { name: 'Last Six Edges', level: 1 })).toBeVisible();
    expect(screen.getByText('0 lange algoritmer')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Næste delmål' }));
    expect(screen.getByText('God kant')).toBeVisible();
    expect(screen.getByText('Dårlig kant')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Næste delmål' }));
    expect(screen.getByText('M′ U M')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Næste delmål' }));
    const patterns = screen.getByText('Frontbytte').closest<HTMLElement>('.lse-pattern-grid');
    expect(patterns).not.toBeNull();
    expect(within(patterns!).getByText('M′ U2 M')).toBeVisible();
    expect(within(patterns!).getByText('M U2 M′')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Næste delmål' }));
    expect(screen.getByText('EO → L/R → 4C · 2 mønstre')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Jeg er klar til LSE' }));

    fireEvent.click(screen.getByRole('button', { name: 'Start uden GoCube' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hele min cube er løst' }));
    await screen.findByText('Hele cuben er løst');
    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.attempts.at(-1)).toMatchObject({
        learningUnitId: 'roux:lse-live',
        generatedParameters: {
          mode: 'self-reported',
          verifiedByCube: false,
          patternCount: 2,
          algorithmCount: 0,
        },
      });
    });
  });

  it('uses live edge progress, guards CMLL, and completes only when the whole cube is solved', async () => {
    const repository = new InMemoryLearningRepository();
    const cube = new MockSmartCubeAdapter(LSE_EO_SETUP_FACELETS);
    await cube.connect();
    renderPage(cube, repository);

    fireEvent.click(await screen.findByRole('button', { name: 'Start LSE med GoCube' }));
    expect(screen.getByText('2/6 gode kanter')).toBeVisible();

    const brokenCmll = [...LSE_EO_SETUP_FACELETS];
    brokenCmll[8] = 'X';
    await act(async () => cube.setFacelets(brokenCmll.join('')));
    expect(await screen.findByText(/hjørnerne er ikke længere løst/)).toBeVisible();
    expect(screen.queryByText('Hele cuben er løst')).not.toBeInTheDocument();

    await act(async () => cube.setFacelets(SOLVED_FACELETS));
    expect(await screen.findByText('Hele cuben er løst')).toBeVisible();
    await waitFor(async () => {
      const snapshot = await repository.load();
      expect(snapshot.attempts.at(-1)).toMatchObject({
        learningUnitId: 'roux:lse-live',
        generatedParameters: { mode: 'live-gocube', verifiedByCube: true },
      });
    });
  });
});
