import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CubeMove } from '../../hardware/smartcube/types';
import { GoCubeMoveCapture } from './GoCubeMoveCapture';

describe('GoCubeMoveCapture', () => {
  it('records the raw event before advancing to the next instructed move', () => {
    localStorage.clear();
    const onClear = vi.fn();
    const { rerender } = render(<GoCubeMoveCapture connected history={[]} onClear={onClear} />);

    expect(screen.getByText(/Det røde lag er nu til højre/)).toBeVisible();
    expect(screen.getByText('R = Right (højre) · laget på din højre hånd')).toBeVisible();
    expect(screen.queryByText(/højre yderlag/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start måling af R' }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Dit håndtræk: R');

    const wrongMove: CubeMove = { notation: 'B', timestamp: 100, source: 'bluetooth' };
    rerender(<GoCubeMoveCapture connected history={[wrongMove]} onClear={onClear} />);
    expect(screen.getByRole('status')).toHaveTextContent('GoCube skriver: B');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Stop: R → B betyder, at referencegrebet ikke passer'
    );
    expect(screen.queryByRole('button', { name: /Gem målingen R → B/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ryd og prøv R igen' }));
    expect(onClear).toHaveBeenCalledTimes(2);

    const correctMove: CubeMove = { notation: 'R', timestamp: 200, source: 'bluetooth' };
    rerender(<GoCubeMoveCapture connected history={[correctMove]} onClear={onClear} />);
    expect(screen.getByRole('status')).toHaveTextContent('Bekræftet: R → R');
    fireEvent.click(screen.getByRole('button', { name: 'Gem målingen R → R og fortsæt' }));

    expect(screen.getByText('R → R')).toBeVisible();
    expect(screen.getByText('Dit håndtræk: R · rå GoCube-kode: R')).toBeVisible();
    expect(localStorage.getItem('peterlingo:gocube-move-calibration:v2')).toContain('"R"');
    expect(screen.getByRole('button', { name: "Start måling af R'" })).toBeVisible();
  });
});
