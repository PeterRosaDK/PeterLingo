import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BcsStackOverview } from './BcsStackOverview';

describe('BcsStackOverview', () => {
  it('shows every physical stack position in canonical order', () => {
    render(<BcsStackOverview />);

    const positions = screen.getByRole('list', { name: 'Den komplette BCS-rækkefølge' });
    expect(positions.children).toHaveLength(52);
    expect(positions.firstElementChild).toHaveTextContent('Es spar');
    expect(positions.lastElementChild).toHaveTextContent('Konge spar');
    expect(screen.getByText(/begynd med nummer 52/i)).toBeInTheDocument();
  });
});
