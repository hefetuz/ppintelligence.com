// Shared timing preserves one object from the intro into the interactive scene.
export const TAU = Math.PI * 2;
export const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
export const enter = (n: number) => 1 - Math.pow(1 - clamp(n), 4);
export const phase = (t: number, start: number, duration: number) => ease((t - start) / duration);
export const seeded = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Integral of a smooth velocity ramp. Never interpolates between angles, so it
// cannot reverse or snap when the intro hands off to the eight-second loop.
export function spinAngle(time: number, start: number) {
  const t = Math.max(0, time - start), ramp = .65;
  const u = Math.min(t / ramp, 1);
  const distance = t < ramp ? ramp * (u ** 3 - .5 * u ** 4) : t - ramp / 2;
  return -.22 + distance * TAU / 8;
}

export function bezier(a: number, b: number, c: number, d: number, t: number) {
  const s = 1 - t;
  return s ** 3 * a + 3 * s * s * t * b + 3 * s * t * t * c + t ** 3 * d;
}
