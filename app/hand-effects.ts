import { clamp, HAND_DIRECTIONS, touchWarp, type HandDirection, type SpringPoint } from './hand-motion';
import { triangleTransform, type Point2 } from './coin-geometry';

export type SurfaceGrain = SpringPoint & { x: number; y: number; symbol: number; seed: number; tone: number };
export type HandPose = { pivot: number; dx: number; dy: number; rotation: number };
export type EffectHand = { x: number; y: number; width: number; height: number; side: number; points: SurfaceGrain[] };
type Input = {
  ctx: CanvasRenderingContext2D; material: HTMLCanvasElement; sprite: HTMLCanvasElement;
  width: number; height: number; dpr: number; sceneY: number; coinRadius: number;
  hands: EffectHand[]; poses: HandPose[]; time: number; delta: number;
  pointer: { x: number; y: number; active: boolean; keyboard: boolean };
  interactive: boolean; moving: boolean; reveal: number;
};

export function createHandEffects(direction: HandDirection) {
  const profile = HAND_DIRECTIONS[direction];
  const patch = document.createElement('canvas'), sample = document.createElement('canvas');
  const c = patch.getContext('2d'), s = sample.getContext('2d');
  let x = -1000, y = -1000, strength = 0, field = 120, size = 0, dpr = 1;
  let dragX = 0, dragY = 0;
  let handWeights = [0, 0];

  const deform = (i: Input) => {
    if (!c || !s) return;
    const half = size / 2, left = x - half, top = y - half;
    s.setTransform(dpr, 0, 0, dpr, 0, 0);
    s.globalCompositeOperation = 'source-over'; s.globalAlpha = 1;
    s.clearRect(0, 0, size, size);
    s.drawImage(i.material, left * dpr, top * dpr, size * dpr, size * dpr, 0, 0, size, size);
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, size, size);
    const cells = 12, step = size / cells;
    const vertices: Point2[] = [];
    for (let row = 0; row <= cells; row++) for (let col = 0; col <= cells; col++) {
      const px = col * step, py = row * step;
      const warp = touchWarp(direction, px - half, py - half, field, i.time, strength, { x: dragX, y: dragY });
      vertices.push({ x: px + warp.x, y: py + warp.y });
    }
    const triangle = (source: Point2[], target: Point2[], sx: number, sy: number) => {
      const matrix = triangleTransform(source, target);
      if (!matrix) return;
      c.save(); c.beginPath();
      const cx = (target[0].x + target[1].x + target[2].x) / 3;
      const cy = (target[0].y + target[1].y + target[2].y) / 3;
      target.forEach((p, n) => {
        const distance = Math.max(1, Math.hypot(p.x - cx, p.y - cy));
        const px = p.x + (p.x - cx) / distance * .4;
        const py = p.y + (p.y - cy) / distance * .4;
        if (n) c.lineTo(px, py); else c.moveTo(px, py);
      });
      c.closePath(); c.clip(); c.transform(...matrix);
      // Crop each cell before mapping; no full-screen redraw per mesh face.
      c.drawImage(sample, (sx - .75) * dpr, (sy - .75) * dpr, (step + 1.5) * dpr, (step + 1.5) * dpr, sx - .75, sy - .75, step + 1.5, step + 1.5);
      c.restore();
    };
    for (let row = 0; row < cells; row++) for (let col = 0; col < cells; col++) {
      const sx = col * step, sy = row * step, n = row * (cells + 1) + col;
      const a = { x: sx, y: sy }, b = { x: sx + step, y: sy }, d = { x: sx, y: sy + step }, e = { x: sx + step, y: sy + step };
      triangle([a, b, e], [vertices[n], vertices[n + 1], vertices[n + cells + 2]], sx, sy);
      triangle([a, e, d], [vertices[n], vertices[n + cells + 2], vertices[n + cells + 1]], sx, sy);
    }
    // Replace the region, avoiding a ghosted duplicate of the original hand.
    i.ctx.save(); i.ctx.beginPath(); i.ctx.rect(0, 0, i.width, i.height);
    i.ctx.rect(left, top, size, size); i.ctx.clip('evenodd');
    i.ctx.drawImage(i.material, 0, 0, i.width, i.height); i.ctx.restore();
    i.ctx.drawImage(patch, left, top, size, size);

    // A studio reflection is clipped to the deformed material's actual alpha.
    s.clearRect(0, 0, size, size); s.drawImage(patch, 0, 0, size, size);
    s.globalCompositeOperation = 'source-in';
    const shift = Math.sin(i.time * .8) * field * .16;
    const light = s.createLinearGradient(shift, 0, size + shift, size * .55);
    const tint = direction === 'hands' ? '245,208,156' : '225,237,245';
    light.addColorStop(0, 'transparent'); light.addColorStop(.35, 'transparent');
    light.addColorStop(.49, `rgba(${tint},.5)`); light.addColorStop(.58, `rgba(${tint},.08)`); light.addColorStop(.8, 'transparent');
    s.fillStyle = light; s.fillRect(0, 0, size, size);
    s.globalCompositeOperation = 'destination-in';
    const falloff = s.createRadialGradient(half, half, field * .1, half, half, field);
    falloff.addColorStop(0, '#fff'); falloff.addColorStop(1, 'transparent');
    s.fillStyle = falloff; s.fillRect(0, 0, size, size);
    s.globalCompositeOperation = 'source-over';
    i.ctx.save(); i.ctx.globalCompositeOperation = 'screen'; i.ctx.globalAlpha = strength * .52;
    i.ctx.drawImage(sample, left, top, size, size); i.ctx.restore();
  };

  return {
    pose(side: number) {
      const weight = handWeights[side], toward = side ? -1 : 1;
      return { dx: toward * weight * (direction === 'hands' ? 5 : 3), dy: -weight * 2.5, rotation: toward * weight * .003 };
    },
    render(i: Input) {
      field = Math.min(profile.field, Math.max(88, i.width * .18));
      const nextSize = Math.ceil(field * 2 + 8);
      if (size !== nextSize || dpr !== i.dpr) {
        size = nextSize; dpr = i.dpr;
        patch.width = sample.width = Math.ceil(size * dpr);
        patch.height = sample.height = Math.ceil(size * dpr);
      }
      const nearest = [Infinity, Infinity];
      if (i.pointer.active && i.interactive) for (const hand of i.hands) {
        const pose = i.poses[hand.side], co = Math.cos(pose.rotation), si = Math.sin(pose.rotation);
        for (const p of hand.points) {
          const lx = hand.x + p.x - pose.pivot, ly = hand.y + p.y - i.sceneY;
          const px = pose.pivot + pose.dx + lx * co - ly * si;
          const py = i.sceneY + pose.dy + lx * si + ly * co;
          nearest[hand.side] = Math.min(nearest[hand.side], (px - i.pointer.x) ** 2 + (py - i.pointer.y) ** 2);
        }
      }
      const hit = i.pointer.active && i.interactive && Math.min(...nearest) < 400;
      if (i.moving) {
        const follow = 1 - Math.exp(-i.delta * 14);
        if (strength < .004 && hit) { x = i.pointer.x; y = i.pointer.y; }
        const dx = i.pointer.active ? clamp((i.pointer.x - x) / Math.max(i.delta, .004) * .05, -48, 48) : 0;
        const dy = i.pointer.active ? clamp((i.pointer.y - y) / Math.max(i.delta, .004) * .05, -48, 48) : 0;
        dragX += (dx - dragX) * follow; dragY += (dy - dragY) * follow;
        if (i.pointer.active) { x = i.pointer.x; y = i.pointer.y; }
        strength += ((hit ? 1 : 0) - strength) * (1 - Math.exp(-i.delta * (hit ? 10 : 6)));
        handWeights = handWeights.map((weight, side) => weight + ((hit && nearest[side] < 400 ? 1 : 0) - weight) * follow);
      }
      if (strength < .003 || !c || !s) i.ctx.drawImage(i.material, 0, 0, i.width, i.height);
      else deform(i);
    },
    clear() { patch.width = patch.height = sample.width = sample.height = 1; },
  };
}
