import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CubeMove } from '../../hardware/smartcube/types';
import { GoCubeMoveCapture } from './GoCubeMoveCapture';

describe('GoCubeMoveCapture', () => {
  it('records the raw event before advancing to the next instructed move', () => {
    localStorage.clear();
    const onClear = vi.fn();
    const { rerender } = render(<GoCubeMoveCapture connected history={[]} onClear={onClear} />);

    expect(screen.getByText(/laget på din højre hånd 90° med uret/)).toBeVisible();
    expect(screen.getByText('R = Right (højre) · laget på din højre hånd')).toBeVisible();
    expect(screen.queryByText(/højre yderlag/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start måling af R' }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Dit håndtræk: R');

    const move: CubeMove = { notation: 'B', timestamp: 100, source: 'bluetooth' };
    rerender(<GoCubeMoveCapture connected history={[move]} onClear={onClear} />);
    expect(screen.getByRole('status')).toHaveTextContent('GoCube skriver: B');
    expect(screen.getByRole('status')).toHaveTextContent('Fundet oversættelse: R → B');
    fireEvent.click(screen.getByRole('button', { name: 'Gem oversættelsen R → B og fortsæt' }));

    expect(screen.getByText('R → B')).toBeVisible();
    expect(screen.getByText('Dit håndtræk: R · rå GoCube-kode: B')).toBeVisible();
    expect(localStorage.getItem('peterlingo:gocube-move-calibration:v1')).toContain('"B"');
    expect(screen.getByRole('button', { name: "Start måling af R'" })).toBeVisible();
  });
});
