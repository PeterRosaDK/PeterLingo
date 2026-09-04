import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const viewer = vi.hoisted(() => ({
  quaternionSet: vi.fn(),
  updateMatrixWorld: vi.fn(),
  scheduleRender: vi.fn(),
}));

vi.mock('cubing/twisty', () => ({
  TwistyPlayer: function MockTwistyPlayer() {
    const element = document.createElement('div');
    return Object.assign(element, {
      experimentalCurrentThreeJSPuzzleObject: async () => ({
        quaternion: { x: 0, y: 0, z: 0, w: 1, set: viewer.quaternionSet },
        updateMatrixWorld: viewer.updateMatrixWorld,
      }),
      experimentalCurrentVantages: async () => [{ scheduleRender: viewer.scheduleRender }],
      jumpToStart: vi.fn(),
      jumpToEnd: vi.fn(),
    });
  },
}));

import { CubeViewer } from './CubeViewer';

describe('CubeViewer GoCube orientation', () => {
  it('uses the first reading automatically and renders later physical rotation', async () => {
    const reference = {
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: 1,
    };
    const { rerender } = render(<CubeViewer orientation={reference} />);

    await waitFor(() => expect(viewer.quaternionSet).toHaveBeenCalled());
    expect(viewer.quaternionSet).toHaveBeenLastCalledWith(0, 0, 0, 1);

    const halfSqrt = Math.sqrt(0.5);
    rerender(
      <CubeViewer
        orientation={{
          quaternion: { x: halfSqrt, y: 0, z: 0, w: halfSqrt },
          timestamp: 2,
        }}
      />
    );

    await waitFor(() => {
      const latest = viewer.quaternionSet.mock.calls.at(-1);
      expect(latest?.[0]).toBeCloseTo(halfSqrt);
      expect(latest?.[3]).toBeCloseTo(halfSqrt);
    });
    expect(viewer.scheduleRender).toHaveBeenCalled();
  });
});
