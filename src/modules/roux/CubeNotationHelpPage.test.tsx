import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CubeNotationHelpPage } from './CubeNotationHelpPage';

describe('Roux help', () => {
  it('explains the complete beginner method before notation', () => {
    render(
      <MemoryRouter>
        <CubeNotationHelpPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Sådan virker Roux' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Byg to blokke—ikke en hel side' })).toBeVisible();
    expect(screen.getByText('First Block', { selector: 'strong' })).toBeVisible();
    expect(screen.getByText('Second Block', { selector: 'strong' })).toBeVisible();
    expect(screen.getByText('CMLL', { selector: 'strong' })).toBeVisible();
    expect(screen.getByText('Last Six Edges', { selector: 'strong' })).toBeVisible();
    expect(screen.getByText(/især M-midterskiven og U-toppen/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Hvorfor hvid/GO op og grøn frem?' })).toBeVisible();
    expect(screen.getByText(/kan senere udvides med hurtigere algoritmer/)).toBeVisible();

    const method = screen.getByRole('heading', { name: 'De fire faser, trin for trin' });
    const notation = screen.getByRole('heading', { name: 'Cubens alfabet' });
    expect(
      method.compareDocumentPosition(notation) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
