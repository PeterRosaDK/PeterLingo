import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SOLVED_FACELETS } from '../../hardware/smartcube/state';
import { CubeFaceletNet, splitFacelets } from './CubeFaceletNet';

describe('CubeFaceletNet', () => {
  it('splits URFDLB facelets into six faces', () => {
    expect(splitFacelets(SOLVED_FACELETS)).toEqual([
      Array(9).fill('U'),
      Array(9).fill('R'),
      Array(9).fill('F'),
      Array(9).fill('D'),
      Array(9).fill('L'),
      Array(9).fill('B'),
    ]);
  });

  it('shows an honest empty state for incomplete data', () => {
    render(<CubeFaceletNet facelets="URF" />);
    expect(screen.getByText('Afventer en fuld aflæsning fra terningen.')).toBeVisible();
  });
});
