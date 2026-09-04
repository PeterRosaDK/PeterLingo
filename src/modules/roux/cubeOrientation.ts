import type { CubeOrientation } from '../../hardware/smartcube/types';

export type Quaternion = CubeOrientation['quaternion'];

export function multiplyQuaternion(left: Quaternion, right: Quaternion): Quaternion {
  return {
    x: left.w * right.x + left.x * right.w + left.y * right.z - left.z * right.y,
    y: left.w * right.y - left.x * right.z + left.y * right.w + left.z * right.x,
    z: left.w * right.z + left.x * right.y - left.y * right.x + left.z * right.w,
    w: left.w * right.w - left.x * right.x - left.y * right.y - left.z * right.z,
  };
}

function inverseQuaternion(quaternion: Quaternion): Quaternion {
  const squaredLength =
    quaternion.x * quaternion.x +
    quaternion.y * quaternion.y +
    quaternion.z * quaternion.z +
    quaternion.w * quaternion.w;
  if (!squaredLength) return { x: 0, y: 0, z: 0, w: 1 };
  return {
    x: -quaternion.x / squaredLength,
    y: -quaternion.y / squaredLength,
    z: -quaternion.z / squaredLength,
    w: quaternion.w / squaredLength,
  };
}

// smartcube-web-bluetooth maps GoCubens wire axes before emitting them. Convert them back to the
// frame used by cubing.js' own GoCube renderer, then apply its required Y-axis correction.
function toCubingGoCubeFrame(quaternion: Quaternion): Quaternion {
  return {
    x: quaternion.x,
    y: -quaternion.z,
    z: -quaternion.y,
    w: quaternion.w,
  };
}

export function relativeGoCubeQuaternion(current: Quaternion, reference: Quaternion): Quaternion {
  const currentFrame = toCubingGoCubeFrame(current);
  const referenceFrame = toCubingGoCubeFrame(reference);
  const relative = multiplyQuaternion(currentFrame, inverseQuaternion(referenceFrame));
  return { ...relative, y: -relative.y };
}
