import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import { colorCounts, ManualCubeStatePage, withCanonicalCenters } from './ManualCubeStatePage';

describe('manual cube state', () => {
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
});
