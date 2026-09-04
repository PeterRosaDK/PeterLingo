import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { RouxTrainingPage } from './RouxTrainingPage';

vi.mock('../../hardware/smartcube/physicalCube', () => ({
  physicalCubeAdapter: {},
}));

vi.mock('./RouxStartCube', () => ({
  RouxStartCube: ({ onQuickSolve }: { onQuickSolve(): void }) => (
    <section aria-label="Live GoCube">
      <div aria-label="Interaktiv 3D Rubiks terning" />
      <button type="button" onClick={onQuickSolve}>
        Løs hurtigt
      </button>
    </section>
  ),
}));

vi.mock('./RouxQuickSolvePanel', () => ({
  RouxQuickSolvePanel: ({ onClose }: { onClose(): void }) => (
    <section>
      <h2>Følg ét træk ad gangen</h2>
      <button type="button" onClick={onClose}>
        Tilbage til faserne
      </button>
    </section>
  ),
}));

afterEach(cleanup);

describe('Roux workbench', () => {
  it('keeps the live cube beside the four directly selectable phases', () => {
    render(
      <MemoryRouter>
        <RouxTrainingPage cubeAdapter={new MockSmartCubeAdapter()} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Interaktiv 3D Rubiks terning')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'De fire Roux-faser' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Start fase 1: First Block' })).toHaveAttribute(
      'href',
      '/fag/roux/first-block'
    );
    expect(screen.getByRole('link', { name: 'Start fase 4: Last Six Edges' })).toHaveAttribute(
      'href',
      '/fag/roux/lse'
    );
  });

  it('opens quick solving in the right-hand panel and returns in place', () => {
    render(
      <MemoryRouter>
        <RouxTrainingPage cubeAdapter={new MockSmartCubeAdapter()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Løs hurtigt' }));
    expect(screen.getByRole('heading', { name: 'Følg ét træk ad gangen' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'De fire Roux-faser' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tilbage til faserne' }));
    expect(screen.getByRole('heading', { name: 'De fire Roux-faser' })).toBeVisible();
  });
});
