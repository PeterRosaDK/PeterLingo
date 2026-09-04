import { describe, expect, it } from 'vitest';
import { relativeGoCubeQuaternion } from './cubeOrientation';

describe('GoCube orientation', () => {
  it('uses the first reading as a neutral reference', () => {
    const reading = { x: 0.2, y: -0.4, z: 0.1, w: 0.89 };
    const relative = relativeGoCubeQuaternion(reading, reading);
    expect(relative.x).toBeCloseTo(0);
    expect(relative.y).toBeCloseTo(0);
    expect(relative.z).toBeCloseTo(0);
    expect(relative.w).toBeCloseTo(1);
  });

  it('restores GoCubens mapped axes before applying the cubing.js Y correction', () => {
    const halfSqrt = Math.sqrt(0.5);
    const reference = { x: 0, y: 0, z: 0, w: 1 };

    expect(
      relativeGoCubeQuaternion({ x: halfSqrt, y: 0, z: 0, w: halfSqrt }, reference)
    ).toMatchObject({ x: halfSqrt, y: -0, z: 0, w: halfSqrt });
    expect(
      relativeGoCubeQuaternion({ x: 0, y: 0, z: -halfSqrt, w: halfSqrt }, reference)
    ).toMatchObject({ x: 0, y: -halfSqrt, z: 0, w: halfSqrt });
  });
});
