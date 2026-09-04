export type HandDirection = 'orbit' | 'morph' | 'hands';
export type Point = { x: number; y: number };
export type SpringPoint = { offsetX: number; offsetY: number; vx: number; vy: number; energy: number };
export const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
export const smooth = (n: number) => { const x = clamp(n); return x * x * (3 - 2 * x); };
const TAU = Math.PI * 2;

export const HAND_DIRECTIONS = {
  orbit: { name: 'Silver tide', hint: 'A touch. A different perspective.', field: 118, opacity: 0, warmth: .36, grain: .07 },
  morph: { name: 'Liquid platinum', hint: 'A little intelligence changes everything.', field: 136, opacity: 0, warmth: .25, grain: .045 },
  hands: { name: 'Human imprint', hint: 'Human insight. Tangible value.', field: 110, opacity: 0, warmth: .62, grain: .11 },
} as const;

export function materialTone(luminance: number, direction: HandDirection): [number, number, number] {
  const t = Math.pow(clamp((luminance - .04) / .96), direction === 'morph' ? 1.5 : direction === 'orbit' ? 1.18 : .95);
  const low = direction === 'morph' ? [24, 29, 34] : direction === 'orbit' ? [31, 36, 43] : [46, 39, 31];
  const high = direction === 'morph' ? [232, 234, 231] : direction === 'orbit' ? [210, 216, 221] : [236, 222, 197];
  return low.map((n, i) => n + (high[i] - n) * t) as [number, number, number];
}

export type FieldInput = { x: number; y: number; cx: number; cy: number; radius: number; time: number; seed: number; side: number; strength: number };
export function handField(direction: HandDirection, p: FieldInput) {
  const dx = p.x - p.cx, dy = p.y - p.cy;
  const distance = Math.hypot(dx, dy);
  const envelope = smooth(1 - distance / Math.max(1, p.radius));
  const weight = envelope * p.strength;
  const angle = Math.atan2(dy, dx) + p.time * 1.75 + p.seed * TAU;
  if (direction === 'orbit') {
    const radius = 26 + distance * .48 + p.seed * 25;
    return {
      x: clamp((Math.cos(angle) * radius - dx) * weight, -130, 130),
      y: clamp((Math.sin(angle) * radius * .62 - dy - 28) * weight, -115, 115),
      weight, depth: .5 + Math.sin(angle) * .5,
    };
  }
  if (direction === 'morph') {
    const wave = Math.sin(distance / 31 - p.time * 2.2);
    return { x: (dx / Math.max(18, distance) * wave * 15 + Math.sin(p.time) * 5) * weight, y: dy / Math.max(18, distance) * wave * 10 * weight, weight, depth: .5 };
  }
  const towardCoin = p.side ? -1 : 1;
  const flow = p.time * 2.3 + p.seed * TAU + dx * .015;
  return {
    x: towardCoin * (42 + Math.sin(flow) * 25) * weight,
    y: (-24 + Math.sin(flow + dx * .014) * 22) * weight,
    weight, depth: .5 + Math.cos(flow) * .5,
  };
}

export function advanceHandSpring(p: SpringPoint, target: Point & { weight: number }, seconds: number, direction: HandDirection) {
  const delta = clamp(seconds, 0, .05);
  p.energy += (target.weight - p.energy) * (1 - Math.exp(-delta * (target.weight > p.energy ? 14 : 7)));
  const stiffness = direction === 'orbit' ? 115 : 145;
  const damping = direction === 'orbit' ? 18.5 : 22;
  const steps = Math.max(1, Math.ceil(delta / .008));
  const dt = delta / steps;
  for (let i = 0; i < steps; i++) {
    p.vx += ((target.x - p.offsetX) * stiffness - p.vx * damping) * dt;
    p.vy += ((target.y - p.offsetY) * stiffness - p.vy * damping) * dt;
    p.offsetX += p.vx * dt; p.offsetY += p.vy * dt;
  }
  if (Math.abs(p.offsetX) + Math.abs(p.offsetY) + Math.abs(p.vx) + Math.abs(p.vy) < .005 && p.energy < .001) {
    p.offsetX = p.offsetY = p.vx = p.vy = p.energy = 0;
  }
}

export function surfaceWarp(x: number, y: number, radius: number, time: number, strength: number) {
  const envelope = smooth(1 - Math.hypot(x, y) / Math.max(1, radius));
  const wave = Math.sin(y / 34 - time * 1.85);
  return { x: wave * 17 * envelope * strength, y: Math.sin(x / 51 + time * 1.35) * 8 * envelope * strength };
}

// Continuous local deformation. The perimeter stays fixed; no detached particles.
export function touchWarp(direction: HandDirection, x: number, y: number, radius: number, time: number, strength: number, drag: Point = { x: 0, y: 0 }) {
  const distance = Math.hypot(x, y), envelope = smooth(1 - distance / Math.max(radius, 1));
  const weight = envelope * envelope * strength;
  if (!weight) return { x: 0, y: 0 };
  const nx = x / radius, ny = y / radius;
  if (direction === 'orbit') {
    const twist = weight * (.13 + Math.sin(time * 1.2 - distance / 32) * .08);
    return { x: -y * twist + drag.x * weight * .09, y: x * twist + drag.y * weight * .09 };
  }
  if (direction === 'hands') {
    const pressure = weight * (-.21 + Math.sin(distance / 24 - time * 1.9) * .075);
    return { x: x * pressure, y: y * pressure + Math.sin(time * 1.4) * weight * ny * 3 };
  }
  return {
    x: (Math.sin(ny * 4.2 - time * 1.6) * ny * 30 + nx * 19 + drag.x * .16) * weight,
    y: (Math.sin(nx * 4.1 + time * 1.3) * nx * 18 + ny * 12 + drag.y * .14) * weight,
  };
}
