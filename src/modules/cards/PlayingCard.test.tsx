import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayingCard, cardAssetPath } from './PlayingCard';

describe('PlayingCard', () => {
  it('renders an accessible local SVG face', () => {
    render(<PlayingCard card="7H" />);
    expect(screen.getByRole('img', { name: '7 hjerter' })).toBeVisible();
    expect(cardAssetPath('7H')).toBe('/assets/cards/fronts/hearts/7%20of%20hearts.svg');
  });

  it('supports a labelled card back', () => {
    render(<PlayingCard card="1S" face="back" />);
    expect(screen.getByRole('img', { name: 'Kort med bagsiden opad' })).toBeVisible();
  });
});
