import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
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
    expect(screen.getByRole('button', { name: 'Kalibrer' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Forbind GoCube' })).toBeVisible();
  });

  it('resets solved state directly and aligns the current gyro reading', async () => {
    const cube = new MockSmartCubeAdapter(SCRAMBLED_FACELETS);
    await cube.connect();
    cube.setOrientation({ x: 0.2, y: 0.1, z: 0.3, w: 0.9 });
    const calibrate = vi.spyOn(cube, 'calibrateSolvedState');
    const confirm = vi.spyOn(window, 'confirm');

    render(
      <MemoryRouter>
        <RouxStartCube adapter={cube} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Kalibrer' }));

    await screen.findByText(/Kalibreret: hvid\/GO er op, grøn er frem/);
    expect(confirm).not.toHaveBeenCalled();
    expect(calibrate).toHaveBeenCalledOnce();
    await waitFor(() => expect(cube.getCubeState()?.facelets).toBe(SOLVED_FACELETS));
  });
});
