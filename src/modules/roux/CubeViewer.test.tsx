import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const viewer = vi.hoisted(() => ({
  quaternionSet: vi.fn(),
  updateMatrixWorld: vi.fn(),
  scheduleRender: vi.fn(),
  constructorOptions: [] as unknown[],
}));

vi.mock('cubing/twisty', () => ({
  TwistyPlayer: function MockTwistyPlayer(options: unknown) {
    viewer.constructorOptions.push(options);
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
  beforeEach(() => {
    vi.clearAllMocks();
    viewer.constructorOptions = [];
  });

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

  it('uses an explicit calibration reading as the new white-up, green-front reference', async () => {
    const initial = {
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: 1,
    };
    const halfSqrt = Math.sqrt(0.5);
    const calibrated = {
      quaternion: { x: halfSqrt, y: 0, z: 0, w: halfSqrt },
      timestamp: 2,
    };
    const { rerender } = render(<CubeViewer orientation={initial} />);
    await waitFor(() => expect(viewer.quaternionSet).toHaveBeenCalled());

    rerender(<CubeViewer orientation={calibrated} orientationReference={calibrated} />);

    await waitFor(() => {
      const latest = viewer.quaternionSet.mock.calls.at(-1);
      expect(latest?.[0]).toBeCloseTo(0);
      expect(latest?.[1]).toBeCloseTo(0);
      expect(latest?.[2]).toBeCloseTo(0);
      expect(latest?.[3]).toBeCloseTo(1);
    });
  });

  it('can render the calibration frame straight on without drag rotation', async () => {
    render(<CubeViewer cameraLatitude={0} cameraLongitude={0} allowDrag={false} />);

    await waitFor(() => expect(viewer.constructorOptions).toHaveLength(1));
    expect(viewer.constructorOptions[0]).toMatchObject({
      cameraLatitude: 0,
      cameraLongitude: 0,
      experimentalDragInput: 'none',
    });
  });

  it('passes a fixed Roux target stickering to the 3D renderer', async () => {
    render(<CubeViewer allowDrag={false} stickering="FirstBlock" ariaLabel="Fast 3D-mål" />);

    await waitFor(() => expect(viewer.constructorOptions).toHaveLength(1));
    expect(viewer.constructorOptions[0]).toMatchObject({
      experimentalDragInput: 'none',
      experimentalStickering: 'FirstBlock',
    });
    expect(screen.getByLabelText('Fast 3D-mål')).toBeVisible();
  });
});
