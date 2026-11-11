/** Canvas uses downward Y. Conjugate its Rx(tilt) Ry(yaw) into upward Y. */
export function mintedCoinRotation(yaw, tilt) {
  return { x: -tilt, y: yaw, z: 0, order: 'XYZ' };
}

/** Preserve the exact opening camera, then continuously settle onto the deck. */
export function scrollCoinCamera(start, turn, targetTilt) {
  const t = Math.max(0, Math.min(1, turn));
  const tilt = start.tilt ?? 0.17;
  const perspective = start.perspective ?? 1;
  const roll = start.roll ?? 0;
  return {
    tilt: tilt + (targetTilt - tilt) * t,
    perspective: perspective * (1 - t),
    roll: roll * (1 - t),
  };
}

/** Same homogeneous camera as projectCoin, including intermediate strengths. */
export function mintedCoinProjection(strength = 1) {
  const p = Math.max(0, Math.min(1, strength));
  // Column-major. clip.w = 1 - z * p / 5.5; +/-1.28 fills the surface.
  return [
    1 / 1.28,
    0,
    0,
    0,
    0,
    1 / 1.28,
    0,
    0,
    0,
    0,
    -0.01,
    -p / 5.5,
    0,
    0,
    0,
    1,
  ];
}
