import { advanceHandSpring, clamp, handField, HAND_DIRECTIONS, smooth, surfaceWarp, type HandDirection, type SpringPoint } from './hand-motion';

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
type WorldGrain = { point: SurfaceGrain; x: number; y: number; side: number };

export function createHandEffects(direction: HandDirection) {
  const profile = HAND_DIRECTIONS[direction];
  const patch = document.createElement('canvas'), light = document.createElement('canvas');
  const patchCtx = patch.getContext('2d'), lightCtx = light.getContext('2d');
  let x = -1000, y = -1000, strength = 0, field = 150, patchDpr = 1, patchSize = 0;
  let handWeights = [0, 0], world: WorldGrain[] = [], lastHands: EffectHand[] | undefined;
  const resize = (i: Input) => {
    field = Math.min(profile.field, Math.max(108, i.width * .19));
    const size = Math.ceil(field * 2 + 12);
    if (size !== patchSize || patchDpr !== i.dpr) {
      patchSize = size; patchDpr = i.dpr;
      patch.width = light.width = Math.ceil(size * i.dpr);
      patch.height = light.height = Math.ceil(size * i.dpr);
    }
    if (lastHands !== i.hands) {
      lastHands = i.hands;
      world = i.hands.flatMap(hand => hand.points.map(point => ({ point, x: 0, y: 0, side: hand.side })));
    }
  };
  const mask = (c: CanvasRenderingContext2D, inner = .42) => {
    c.globalCompositeOperation = 'destination-in';
    const gradient = c.createRadialGradient(patchSize / 2, patchSize / 2, field * inner, patchSize / 2, patchSize / 2, field);
    gradient.addColorStop(0, '#fff'); gradient.addColorStop(1, 'transparent');
    c.fillStyle = gradient; c.fillRect(0, 0, patchSize, patchSize); c.globalCompositeOperation = 'source-over';
  };
  const extract = (c: CanvasRenderingContext2D, i: Input) => {
    c.setTransform(i.dpr, 0, 0, i.dpr, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, patchSize, patchSize);
    c.drawImage(i.material, (x - patchSize / 2) * i.dpr, (y - patchSize / 2) * i.dpr, patchSize * i.dpr, patchSize * i.dpr, 0, 0, patchSize, patchSize);
  };
  const paintLight = (i: Input) => {
    if (!lightCtx || strength < .002) return;
    const c = lightCtx, half = patchSize / 2;
    extract(c, i);
    c.globalCompositeOperation = 'source-in';
    if (direction === 'morph') {
      // A broad moving studio strip, not a circular cursor lamp.
      const sweep = Math.sin(i.time * .7) * field * .13;
      const metal = c.createLinearGradient(half - field + sweep, 0, half + field + sweep, patchSize);
      metal.addColorStop(0, 'transparent'); metal.addColorStop(.26, 'rgba(167,194,218,.03)');
      metal.addColorStop(.45, 'rgba(222,234,242,.78)'); metal.addColorStop(.51, 'rgba(255,241,208,.85)');
      metal.addColorStop(.6, 'rgba(178,196,214,.04)'); metal.addColorStop(1, 'transparent');
      c.fillStyle = metal;
    } else {
      const gradient = c.createRadialGradient(half, half, field * .05, half, half, field);
      gradient.addColorStop(0, direction === 'orbit' ? 'rgba(184,212,235,.7)' : 'rgba(239,192,117,.65)');
      gradient.addColorStop(.48, direction === 'orbit' ? 'rgba(219,179,121,.25)' : 'rgba(231,169,91,.25)');
      gradient.addColorStop(1, 'transparent'); c.fillStyle = gradient;
    }
    c.fillRect(0, 0, patchSize, patchSize); mask(c);
    i.ctx.save(); i.ctx.globalCompositeOperation = 'screen'; i.ctx.globalAlpha = strength;
    i.ctx.drawImage(light, x - half, y - half, patchSize, patchSize); i.ctx.restore();
  };
  const paintLiquid = (i: Input) => {
    if (!patchCtx || strength < .002) return;
    const c = patchCtx, half = patchSize / 2;
    c.setTransform(i.dpr, 0, 0, i.dpr, 0, 0); c.clearRect(0, 0, patchSize, patchSize);
    // Narrow overlapping strips refract the real material, retaining its details.
    // The radial envelope reaches zero at the boundary; no hard lens edge.
    const step = 3;
    for (let row = 0; row < patchSize; row += step) {
      const dy = row - half;
      const warp = surfaceWarp(0, dy, field, i.time, strength);
      const stretch = 1 + Math.sin(dy / 41 + i.time * 1.1) * .065 * smooth(1 - Math.abs(dy) / field) * strength;
      const destinationWidth = patchSize * stretch;
      c.drawImage(i.material,
        (x - half) * i.dpr, (y - half + row) * i.dpr, patchSize * i.dpr, (step + 1) * i.dpr,
        (patchSize - destinationWidth) / 2 + warp.x, row + warp.y, destinationWidth, step + 1.5);
    }
    mask(c, .25);
    const cover = i.ctx.createRadialGradient(x, y, field * .2, x, y, field);
    cover.addColorStop(0, 'rgba(9,11,13,' + strength * .92 + ')'); cover.addColorStop(1, 'transparent');
    i.ctx.fillStyle = cover; i.ctx.fillRect(x - field, y - field, field * 2, field * 2);
    i.ctx.save(); i.ctx.globalAlpha = strength; i.ctx.drawImage(patch, x - half, y - half, patchSize, patchSize); i.ctx.restore();
  };

  return {
    pose(side: number) {
      const weight = handWeights[side], toward = side ? -1 : 1;
      return {
        dx: toward * weight * (direction === 'hands' ? 11 : direction === 'morph' ? 6 : 3),
        dy: -weight * (direction === 'orbit' ? 9 : 5),
        rotation: toward * weight * (direction === 'morph' ? .013 : .008),
      };
    },
    render(i: Input) {
      resize(i);
      const nearest = [Infinity, Infinity];
      for (const grain of world) {
        const hand = i.hands[grain.side], pose = i.poses[grain.side], p = grain.point;
        const c = Math.cos(pose.rotation), s = Math.sin(pose.rotation);
        const lx = hand.x + p.x - pose.pivot, ly = hand.y + p.y - i.sceneY;
        grain.x = pose.pivot + pose.dx + lx * c - ly * s;
        grain.y = i.sceneY + pose.dy + lx * s + ly * c;
        nearest[grain.side] = Math.min(nearest[grain.side], Math.hypot(grain.x - i.pointer.x, grain.y - i.pointer.y));
      }
      const hit = i.pointer.active && i.interactive && Math.min(...nearest) < 22;
      if (i.moving) {
        if (strength < .006 && hit) { x = i.pointer.x; y = i.pointer.y; }
        const follow = i.pointer.keyboard ? 1 : 1 - Math.exp(-i.delta * 12);
        // Hold the last interaction origin during the graceful return.
        if (i.pointer.active) { x += (i.pointer.x - x) * follow; y += (i.pointer.y - y) * follow; }
        strength += ((hit ? 1 : 0) - strength) * (1 - Math.exp(-i.delta * (hit ? 12 : 5.5)));
        handWeights = handWeights.map((weight, side) => weight + ((hit && nearest[side] < 22 ? 1 : 0) - weight) * (1 - Math.exp(-i.delta * 7)));
      }
      i.ctx.drawImage(i.material, 0, 0, i.width, i.height);
      if (direction === 'morph') {
        paintLiquid(i); paintLight(i);
        return;
      }
      paintLight(i);
      if (strength > .002) {
        // Remove the solid surface softly; its currency engraving lifts with it.
        const cavity = i.ctx.createRadialGradient(x, y, 0, x, y, field * .94);
        cavity.addColorStop(0, 'rgba(9,11,13,' + strength * profile.opacity + ')');
        cavity.addColorStop(.4, 'rgba(9,11,13,' + strength * profile.opacity * .65 + ')'); cavity.addColorStop(1, 'transparent');
        i.ctx.fillStyle = cavity; i.ctx.fillRect(x - field, y - field, field * 2, field * 2);
      }
      const drawGrain = (grain: WorldGrain, front: boolean) => {
        const p = grain.point;
        const target = handField(direction, { x: grain.x, y: grain.y, cx: x, cy: y, radius: field, time: i.time, seed: p.seed, side: grain.side, strength });
        if (target.weight < .001 && p.energy < .001 && Math.abs(p.offsetX) + Math.abs(p.offsetY) < .05) return;
        if (!front && i.moving) advanceHandSpring(p, target, i.delta, direction);
        if (p.energy < .002 && Math.abs(p.offsetX) + Math.abs(p.offsetY) < .1) return;
        if ((target.depth >= .5) !== front) return;
        const alpha = clamp(p.energy * 1.45) * (.45 + p.tone * .55) * smooth(i.reveal);
        const size = direction === 'orbit' ? 3.4 + target.depth * 5 + p.energy * 2 : 4.3 + p.energy * 4;
        const px = grain.x + p.offsetX, py = grain.y + p.offsetY;
        if (direction === 'hands' && p.seed > .79 && p.energy > .15) {
          i.ctx.globalAlpha = alpha * .24; i.ctx.strokeStyle = '#d9b47f'; i.ctx.lineWidth = .65;
          i.ctx.beginPath(); i.ctx.moveTo(grain.x, grain.y);
          i.ctx.quadraticCurveTo(grain.x + p.offsetX * .3, grain.y - 24 * p.energy, px, py); i.ctx.stroke();
        }
        if (direction === 'orbit' && p.seed > .76) {
          i.ctx.save(); i.ctx.globalAlpha = alpha; i.ctx.translate(px, py); i.ctx.rotate(i.time * .75 + p.seed * 7);
          i.ctx.fillStyle = target.depth > .65 ? '#edd3a8' : '#adb9c2'; i.ctx.fillRect(-size * .18, -size * .5, size * .36, size); i.ctx.restore();
        } else {
          i.ctx.globalAlpha = alpha;
          const row = direction === 'orbit' && target.depth < .6 ? 16 : 0;
          i.ctx.drawImage(i.sprite, p.symbol * 16, row, 16, 16, px - size / 2, py - size / 2, size, size);
        }
      };
      // Back/front passes give the lifted material a true depth hierarchy.
      for (const grain of world) drawGrain(grain, false);
      for (const grain of world) drawGrain(grain, true);
      i.ctx.globalAlpha = 1;
    },
    clear() { patch.width = patch.height = light.width = light.height = 1; world = []; lastHands = undefined; },
  };
}
