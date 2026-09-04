export type Vec3 = { x: number; y: number; z: number };
export type Point2 = { x: number; y: number };
export const CAMERA_DISTANCE = 5.5;
export const COIN_HALF_DEPTH = .115;

// The sign of every coordinate is retained through the full rotation.
export function rotateCoin(point: Vec3, angle: number, tilt = .17): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  const x = point.x * c + point.z * s;
  const z = -point.x * s + point.z * c;
  return { x, y: point.y * Math.cos(tilt) - z * Math.sin(tilt), z: point.y * Math.sin(tilt) + z * Math.cos(tilt) };
}

export function projectCoin(point: Vec3, radius: number, center: Point2): Point2 {
  const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - point.z);
  return { x: center.x + point.x * radius * perspective, y: center.y + point.y * radius * perspective };
}

export function visibleFace(side: number, angle: number, tilt = .17): boolean {
  const normal = rotateCoin({ x: 0, y: 0, z: side }, angle, tilt);
  return normal.z * CAMERA_DISTANCE > COIN_HALF_DEPTH;
}

export function advanceCoinAngle(angle: number, seconds: number): number {
  return angle + Math.max(0, seconds) * Math.PI * 2 / 8;
}

// Exact affine map from a texture triangle to a projected triangle.
export function triangleTransform(source: Point2[], target: Point2[]) {
  const [s0, s1, s2] = source, [t0, t1, t2] = target;
  const sx1 = s1.x - s0.x, sy1 = s1.y - s0.y;
  const sx2 = s2.x - s0.x, sy2 = s2.y - s0.y;
  const determinant = sx1 * sy2 - sx2 * sy1;
  if (Math.abs(determinant) < 1e-8) return null;
  const tx1 = t1.x - t0.x, ty1 = t1.y - t0.y;
  const tx2 = t2.x - t0.x, ty2 = t2.y - t0.y;
  const a = (tx1 * sy2 - tx2 * sy1) / determinant;
  const b = (ty1 * sy2 - ty2 * sy1) / determinant;
  const c = (tx2 * sx1 - tx1 * sx2) / determinant;
  const d = (ty2 * sx1 - ty1 * sx2) / determinant;
  return [a, b, c, d, t0.x - a * s0.x - c * s0.y, t0.y - b * s0.x - d * s0.y] as const;
}
