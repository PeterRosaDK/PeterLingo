import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { connectionErrorMessage, isStandaloneAppleWebApp, RouxStartCube } from './RouxStartCube';

vi.mock('../../hardware/smartcube/physicalCube', () => ({
  physicalCubeAdapter: {},
  reconnectApprovedCube: vi.fn(async () => false),
}));

const liveViewer = vi.hoisted(() => ({ props: {} as { frontView?: boolean } }));

vi.mock('./LivePhysicalCubeViewer', () => ({
  LivePhysicalCubeViewer: (props: { frontView?: boolean }) => {
    liveViewer.props = props;
    return <div aria-label="Interaktiv 3D Rubiks terning" />;
  },
}));

const SCRAMBLED_FACELETS = 'RFFLUBDBDBRDRRUUFFRDLFFFBBLUUFRDLLBRUDBULUDDLRDBLBRULF';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  liveViewer.props = {};
});

describe('Roux start cube', () => {
  it('detects an installed Apple home-screen web app', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 26_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      maxTouchPoints: 5,
      standalone: true,
    });

    expect(isStandaloneAppleWebApp()).toBe(true);
  });

  it('explains that Beacio requires Safari outside the installed iPad web app', async () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 26_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      maxTouchPoints: 5,
      standalone: true,
    });
    const cube = new MockSmartCubeAdapter();
    vi.spyOn(cube, 'isSupported').mockReturnValue(false);

    render(
      <MemoryRouter>
        <RouxStartCube adapter={cube} />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/Beacio kan ikke indlæses i en installeret iPad-webapp/)
    ).toBeVisible();
    expect(screen.getByText(/kan stadig bruges til læring og offlineøvelser/)).toBeVisible();
  });

  it('distinguishes Beacio, cancellation, no-device, and remembered-connection failures', () => {
    const error = (name: string, code?: string) => Object.assign(new Error(name), { name, code });
    expect(connectionErrorMessage(error('Error', 'USER_CANCELLED'), 'chooser')).toMatch(
      /lukkede enhedsvælgeren/
    );
    expect(connectionErrorMessage(error('Error', 'DEVICE_NOT_FOUND'), 'chooser')).toMatch(
      /Ingen kompatibel cube/
    );
    expect(connectionErrorMessage(error('NetworkError'), 'remembered')).toMatch(
      /tilladelsen findes/
    );
    expect(
      connectionErrorMessage(error('NotFoundError'), 'chooser', {
        api: 'missing',
        extension: 'installed-inactive',
        requestDevice: false,
        getDevices: false,
        rememberedReconnect: false,
        filters: [],
        libraryVersion: '2.1.1',
      })
    ).toMatch(/installeret, men Safari-udvidelsen er ikke aktiv/);
  });

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
    const requestState = vi.spyOn(cube, 'requestState');

    render(
      <MemoryRouter>
        <RouxStartCube adapter={cube} />
      </MemoryRouter>
    );
    expect(liveViewer.props.frontView).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Kalibrer 3D' }));

    await screen.findByText(/grøn direkte forfra med hvid ovenpå/);
    expect(liveViewer.props.frontView).toBe(true);
    expect(requestState).not.toHaveBeenCalled();
    await waitFor(() => expect(cube.getCubeState()?.facelets).toBe(SCRAMBLED_FACELETS));

    await cube.disconnect();
    await waitFor(() => expect(liveViewer.props.frontView).toBe(false));
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

    fireEvent.click(screen.getByRole('button', { name: 'Synkronisér farver' }));
    await screen.findByText(
      'Farverne er hentet fra GoCube igen. Den fysiske cube blev ikke ændret.'
    );
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

    await waitFor(() => expect(cube.getRememberedCubes).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Tilslut' }));
    await screen.findByText('GoCube er klar. Du kan begynde med det samme.');
    expect(cube.connectRemembered).toHaveBeenCalledWith('cube-1', expect.any(Function));
  });

  it('lets a new chooser open on the next tap after remembered reconnect fails', async () => {
    const cube = Object.assign(new MockSmartCubeAdapter(SCRAMBLED_FACELETS), {
      getRememberedCubes: vi.fn(async () => [{ id: 'cube-1', name: 'GoCube_1234' }]),
      connectRemembered: vi.fn(async function (this: MockSmartCubeAdapter) {
        await this.disconnect();
        const error = new Error('Cuben kan ikke nås.');
        error.name = 'NetworkError';
        throw error;
      }),
    });
    const chooser = vi.spyOn(cube, 'connect');
    render(
      <MemoryRouter>
        <RouxStartCube adapter={cube} />
      </MemoryRouter>
    );

    await waitFor(() => expect(cube.getRememberedCubes).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Tilslut' }));
    await screen.findByText(/Tryk Tilslut igen for at åbne enhedsvælgeren/);
    expect(chooser).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Tilslut' }));
    await screen.findByText('GoCube er klar. Du kan begynde med det samme.');
    expect(chooser).toHaveBeenCalledOnce();
  });

  it('keeps a manual correction visible until an explicit hardware sync', async () => {
    const cube = new MockSmartCubeAdapter(SCRAMBLED_FACELETS);
    await cube.connect();
    const clearManual = vi.fn();
    render(
      <MemoryRouter>
        <RouxStartCube
          adapter={cube}
          manualFacelets={SCRAMBLED_FACELETS}
          onHardwareStateRequested={clearManual}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Manuelt rettede farver er låst/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Kalibrer 3D' }));
    expect(clearManual).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Synkronisér farver' }));
    await waitFor(() => expect(clearManual).toHaveBeenCalledOnce());
  });

  it('keeps the manual correction when a hardware sync fails', async () => {
    const cube = new MockSmartCubeAdapter(SCRAMBLED_FACELETS);
    await cube.connect();
    vi.spyOn(cube, 'requestState').mockRejectedValueOnce(new Error('Cuben svarede ikke.'));
    const clearManual = vi.fn();
    render(
      <MemoryRouter>
        <RouxStartCube
          adapter={cube}
          manualFacelets={SCRAMBLED_FACELETS}
          onHardwareStateRequested={clearManual}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Synkronisér farver' }));
    await screen.findByText('Cuben svarede ikke.');
    expect(clearManual).not.toHaveBeenCalled();
  });
});
