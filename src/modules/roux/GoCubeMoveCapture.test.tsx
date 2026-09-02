import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CubeMove } from '../../hardware/smartcube/types';
import { GoCubeMoveCapture } from './GoCubeMoveCapture';

describe('GoCubeMoveCapture', () => {
  it('records the raw event before advancing to the next instructed move', () => {
    const onClear = vi.fn();
    const { rerender } = render(<GoCubeMoveCapture connected history={[]} onClear={onClear} />);

    expect(screen.getByText(/Det røde center er nederst/)).toBeVisible();
    expect(screen.getByText('R = Right (højre) · laget med rødt center')).toBeVisible();
    expect(screen.queryByText(/højre yderlag/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start måling af R' }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Udfør nu R præcis én gang');

    const move: CubeMove = { notation: 'R', timestamp: 100, source: 'bluetooth' };
    rerender(<GoCubeMoveCapture connected history={[move]} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gem måling og fortsæt' }));

    expect(screen.getByText('Du udførte R')).toBeVisible();
    expect(screen.getByText('GoCube sendte R')).toBeVisible();
    expect(screen.getByRole('button', { name: "Start måling af R'" })).toBeVisible();
  });
});
