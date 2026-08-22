import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VirtualPiano } from './VirtualPiano';

describe('VirtualPiano', () => {
  it('renders Danish note names independently of pitch logic', () => {
    render(<VirtualPiano from={69} to={71} naming="danish" />);
    expect(screen.getByRole('button', { name: 'Spil A4' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Spil H4' })).toBeVisible();
  });
});
