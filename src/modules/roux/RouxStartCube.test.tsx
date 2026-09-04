import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { RouxStartCube } from './RouxStartCube';

vi.mock('../../hardware/smartcube/physicalCube', () => ({
  physicalCubeAdapter: {},
  reconnectApprovedCube: vi.fn(async () => false),
}));

vi.mock('./LivePhysicalCubeViewer', () => ({
  LivePhysicalCubeViewer: () => <div aria-label="Interaktiv 3D Rubiks terning" />,
}));

const SCRAMBLED_FACELETS = 'RFFLUBDBDBRDRRUUFFRDLFFFBBLUUFRDLLBRUDBULUDDLRDBLBRULF';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Roux start cube', () => {
  it('shows the 3D cube immediately and keeps calibration unavailable while disconnected', () => {
    render(
      <MemoryRouter>
        <RouxStartCube adapter={new MockSmartCubeAdapter()} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Interaktiv 3D Rubiks terning')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Kalibrer 3D' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tilslut' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Løs hurtigt' })).toBeDisabled();
  });

  it('aligns the 3D viewer without changing the physical cube state', async () => {
    const cube = new MockSmartCubeAdapter(SCRAMBLED_FACELETS);
    await cube.connect();
    cube.setOrientation({ x: 0.2, y: 0.1, z: 0.3, w: 0.9 });
    const calibrate = vi.spyOn(cube, 'calibrateSolvedState');

    render(
      <MemoryRouter>
        <RouxStartCube adapter={cube} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Kalibrer 3D' }));

    await screen.findByText(/3D-cuben er rettet ind/);
    expect(calibrate).not.toHaveBeenCalled();
    await waitFor(() => expect(cube.getCubeState()?.facelets).toBe(SCRAMBLED_FACELETS));
  });

  it('connects and refreshes the cube without leaving the current view', async () => {
    const cube = new MockSmartCubeAdapter(SCRAMBLED_FACELETS);
    const connect = vi.spyOn(cube, 'connect');
    const requestState = vi.spyOn(cube, 'requestState');

    render(
      <MemoryRouter>
        <RouxStartCube adapter={cube} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tilslut' }));
    await screen.findByText('GoCube er klar. Du kan begynde med det samme.');
    expect(connect).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: 'Læs cuben igen' }));
    await screen.findByText('Cubens fulde tilstand er læst igen.');
    expect(requestState).toHaveBeenCalledOnce();
  });

  it('reuses the only approved cube directly without opening a new chooser', async () => {
    const cube = Object.assign(new MockSmartCubeAdapter(SCRAMBLED_FACELETS), {
      getRememberedCubes: vi.fn(async () => [{ id: 'cube-1', name: 'GoCube_1234' }]),
      connectRemembered: vi.fn(async function (this: MockSmartCubeAdapter) {
        await this.connect();
      }),
    });
    render(
      <MemoryRouter>
        <RouxStartCube adapter={cube} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tilslut' }));
    await screen.findByText('GoCube er klar. Du kan begynde med det samme.');
    expect(cube.connectRemembered).toHaveBeenCalledWith('cube-1', expect.any(Function));
  });
});
