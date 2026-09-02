import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import { MockSmartCubeAdapter } from '../../hardware/smartcube/MockSmartCubeAdapter';
import { colorCounts, ManualCubeStatePage, withCanonicalCenters } from './ManualCubeStatePage';

vi.mock('../../hardware/smartcube/physicalCube', async () => {
  const { MockSmartCubeAdapter: MockAdapter } =
    await import('../../hardware/smartcube/MockSmartCubeAdapter');
  return { physicalCubeAdapter: new MockAdapter() };
});

describe('manual cube state', () => {
  const physicalState = 'RFFLUBDBDBRDRRUUFFRDLFFFBBLUUFRDLLBRUDBULUDDLRDBLBRULF';
  it('counts all six colors in a facelet string', () => {
    expect(colorCounts(SOLVED_FACELETS)).toEqual({ U: 9, R: 9, F: 9, D: 9, L: 9, B: 9 });
  });

  it('never lets a reported state redefine the six physical centers', () => {
    expect(withCanonicalCenters('R'.repeat(54))[4]).toBe('U');
    expect(withCanonicalCenters('R'.repeat(54))[13]).toBe('R');
    expect(withCanonicalCenters('R'.repeat(54))[22]).toBe('F');
    expect(withCanonicalCenters('R'.repeat(54))[31]).toBe('D');
    expect(withCanonicalCenters('R'.repeat(54))[40]).toBe('L');
    expect(withCanonicalCenters('R'.repeat(54))[49]).toBe('B');
  });

  it('compares manual edits with the state reported by GoCube', () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/fag/roux/manuel-tilstand', state: { facelets: SOLVED_FACELETS } },
        ]}
      >
        <ManualCubeStatePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hvid side, øverst til venstre: hvid' }));
    expect(screen.getByText('1 felt afviger fra GoCubens aflæsning.')).toBeVisible();
    expect(screen.getByText('Afvigende positioner: hvid side · øverst til venstre')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Kopiér sammenligningen' })).toBeVisible();
  });

  it('lets a connected GoCube confirm solution turns and restores manual fallback on disconnect', async () => {
    const cube = new MockSmartCubeAdapter(physicalState);
    await cube.connect();
    render(
      <MemoryRouter
        initialEntries={[`/fag/roux/manuel-tilstand?facelets=${physicalState}&solve=1`]}
      >
        <ManualCubeStatePage cubeAdapter={cube} />
      </MemoryRouter>
    );

    await screen.findByText('GoCube følger med', {}, { timeout: 20_000 });
    await waitFor(() => expect(screen.getByText('0/21 træk')).toBeVisible(), { timeout: 20_000 });
    expect(screen.queryByRole('button', { name: 'Jeg har lavet trækket' })).not.toBeInTheDocument();

    act(() => cube.emitMove('F'));
    expect(
      screen.getByText('Første kvartdrejning registreret. Fortsæt samme vej til 180°.')
    ).toBeVisible();
    expect(screen.getByText('0/21 træk')).toBeVisible();
    act(() => cube.emitMove('F'));
    await waitFor(() => expect(screen.getByText('1/21 træk')).toBeVisible());

    await act(async () => cube.disconnect());
    expect(screen.getByRole('button', { name: 'Jeg har lavet trækket' })).toBeVisible();
  }, 25_000);
});
