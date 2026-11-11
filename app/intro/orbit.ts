import { clamp, glide, enter, mix, phase, projectedRim, seeded, spinAngle, TAU } from './motion';
import type { IntroDefinition, IntroEnvironment, IntroFrame, Point } from './types';

import { CURRENCY_SYMBOLS as SYMBOLS } from '../currency-symbols';
const CAMERA_DISTANCE = 5.5;
const COIN_HALF_DEPTH = .115;
const TILT_SIN = Math.sin(.17);
const TILT_COS = Math.cos(.17);
const DEPTH_SIN = Math.sin(.7);
const DEPTH_COS = Math.cos(.7);
const gatherStart = (group: number) => 1.55 + group * .012;

// One shared entrance clock. Atmosphere, hands and copy overlap the coin's
// formation instead of behaving like three animations queued after it.
export const ORBIT_ENTRANCE_TIMING = {
  atmosphere: 1.62,
  hands: 2.16,
  transfer: 2.38,
  copy: 3.08,
  end: 3.6,
} as const;

type Tile = {
  x: number; y: number; sx: number; sy: number;
  delay: number; phaseSin: number; phaseCos: number; landFactor: number;
};
type Placement = { x: number; y: number; size: number; rotation: number; depth: number; phaseSin: number; phaseCos: number };

export function orbitProgress(t: number, group: number, seed: number) {
  return glide((t - gatherStart(group) - .24 - seed * .045) / .5);
}

/** Integral of one smooth velocity ramp: the initial orbit never stops or resets. */
export function orbitAngle(t: number) {
  const start = .42, duration = 1, slow = .22, fast = 5.2;
  const elapsed = Math.max(0, t - start), u = Math.min(elapsed / duration, 1);
  const accelerated = elapsed < duration ? duration * (u ** 3 - .5 * u ** 4) : elapsed - duration / 2;
  return slow * t + (fast - slow) * accelerated;
}

export const orbitContraction = (t: number) => glide((t - .9) / 1.42);

/** Tiles keep the group's shared angular phase instead of starting another spiral. */
export function orbitMergePoint(source: Point, seed: number, progress: number, phaseAngle: number, width: number, f: IntroFrame): Point {
  const targetAngle = phaseAngle + (seed - .5) * TAU / SYMBOLS.length * .98;
  const land = f.coinRadius * (.91 + seed * .065);
  const rim = projectedRim(targetAngle, land, f.angle);
  return {
    x: mix(source.x, width / 2 + rim.x, progress),
    y: mix(source.y, f.coinY + rim.y, progress),
  };
}

export function orbitTileAlpha(t: number, group: number, progress: number, coinAlpha: number) {
  const bridge = phase(t, gatherStart(group), .24);
  // Arrival alone never erases the stream; the existing coin must cover it.
  const absorbed = phase(progress, .86, .14) * phase(coinAlpha, .65, .35);
  return bridge * (1 - absorbed);
}

export function orbitFrame(t: number, e: IntroEnvironment): IntroFrame {
  const transfer = phase(t, ORBIT_ENTRANCE_TIMING.transfer, .76);
  return {
    coinY: mix(e.introY ?? e.height * .4, e.sceneY, transfer),
    coinRadius: e.radius,
    coinAlpha: t > 1.9 ? 1 : 0, coinReveal: phase(t, 1.9, .66), mint: phase(t, 1.78, .78),
    angle: spinAngle(t, 2.35), hands: phase(t, ORBIT_ENTRANCE_TIMING.hands, .7),
    handLight: phase(t, ORBIT_ENTRANCE_TIMING.hands + .08, .66), transfer,
  };
}

export const orbitIntro: IntroDefinition = {
  id: 'orbit', title: 'Yörüngeden Darphaneye', shortTitle: 'Yörünge',
  caption: 'Many possibilities. One clear direction.',
  description: 'Başlangıçtaki yörünge aynı eksende hızlanır; semboller dönmeye devam ederken daralıp coin’e birleşir.',
  branch: 'intro/orbit-mint', duration: ORBIT_ENTRANCE_TIMING.end, releaseAt: ORBIT_ENTRANCE_TIMING.copy,
  create() {
    // At phone glyph sizes, 8 source pixels still cover only ~3 CSS pixels.
    // Avoid drawing four times as many subpixel fragments during the merge.
    const TILE_SIZE = 8;
    let glyphs: HTMLCanvasElement[] = [];
    const tiles: Tile[][] = [];
    const placements: Placement[] = SYMBOLS.map(() => ({ x: 0, y: 0, size: 0, rotation: 0, depth: 0, phaseSin: 0, phaseCos: 1 }));
    const order = SYMBOLS.map((_, i) => i);
    const prepare = () => {
      if (glyphs.length) return;
      glyphs = SYMBOLS.map((symbol, group) => {
        const image = document.createElement('canvas'); image.width = image.height = 256;
        const c = image.getContext('2d', { willReadFrequently: true });
        const groupTiles: Tile[] = []; tiles.push(groupTiles);
        if (!c) return image;
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '400 208px "Geist Mono", monospace';
        const metal = c.createLinearGradient(32, 24, 210, 242);
        metal.addColorStop(0, '#fff0d5'); metal.addColorStop(.34, '#d6b580'); metal.addColorStop(.68, '#926b3e'); metal.addColorStop(1, '#edd0a1');
        c.fillStyle = metal; c.fillText(symbol, 128, 128);
        const data = c.getImageData(0, 0, 256, 256).data;
        for (let sy = 0; sy < 256; sy += TILE_SIZE) for (let sx = 0; sx < 256; sx += TILE_SIZE) {
          let occupied = false;
          for (let y = sy; y < sy + TILE_SIZE && !occupied; y++) for (let x = sx; x < sx + TILE_SIZE; x++) {
            if (data[(y * 256 + x) * 4 + 3] > 12) { occupied = true; break; }
          }
          if (!occupied) continue;
          const seed = seeded(sx + sy * 173 + group * 1709);
          const phaseOffset = (seed - .5) * TAU / SYMBOLS.length * .98;
          groupTiles.push({
            x: (sx + TILE_SIZE / 2 - 128) / 208, y: (sy + TILE_SIZE / 2 - 128) / 208,
            sx, sy,
            delay: seed * .045, phaseSin: Math.sin(phaseOffset), phaseCos: Math.cos(phaseOffset), landFactor: .91 + seed * .065,
          });
        }
        return image;
      });
    };
    return {
      frame: orbitFrame,
      draw(ctx, t, e, f) {
        if (t >= 2.56) return;
        prepare();
        const centerX = e.width / 2, centerY = e.introY ?? e.height * .4;
        const angle = orbitAngle(t), contraction = orbitContraction(t);
        const radiusY = mix(Math.min(e.height * .16, e.introMaxRadius ?? 175), f.coinRadius * .94, contraction);
        const radiusX = mix(e.width * .31, f.coinRadius * .94, contraction);
        const orbitY = mix(centerY, f.coinY, contraction);
        const glyphSize = clamp(e.width * .164, 90, 218);
        const contractionScale = mix(1, Math.min(.16, f.coinRadius * 1.6 / glyphSize), contraction);
        for (let group = 0; group < SYMBOLS.length; group++) {
          const a = group / SYMBOLS.length * TAU - Math.PI * .69 + angle;
          const phaseSin = Math.sin(a), phaseCos = Math.cos(a);
          const depth = phaseSin * DEPTH_COS + phaseCos * DEPTH_SIN;
          const p = placements[group];
          p.x = centerX + phaseCos * radiusX;
          p.y = orbitY + phaseSin * radiusY;
          p.size = glyphSize * (1 + depth * .14) * contractionScale;
          p.rotation = phaseCos * .2 + t * .025;
          p.depth = depth;
          p.phaseSin = phaseSin; p.phaseCos = phaseCos;
        }
        for (let i = 1; i < order.length; i++) {
          const item = order[i]; let j = i - 1;
          while (j >= 0 && placements[order[j]].depth > placements[item].depth) { order[j + 1] = order[j]; j--; }
          order[j + 1] = item;
        }
        const coinCoverage = phase(f.coinAlpha, .65, .35);
        const yawSin = Math.sin(f.angle), yawCos = Math.cos(f.angle);
        for (const group of order) {
          const p = placements[group];
          const bridge = phase(t, gatherStart(group), .24);
          const visibility = enter((t - group * .035) / .38) * (.8 + p.depth * .15);
          const cos = Math.cos(p.rotation), sin = Math.sin(p.rotation);
          const sourceSize = p.size * TILE_SIZE / 208;
          const travelTime = t - gatherStart(group) - .24;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
          ctx.globalCompositeOperation = 'source-over';
          if (bridge < 1) {
            ctx.globalAlpha = visibility * (1 - bridge);
            const size = p.size * 256 / 208;
            ctx.drawImage(glyphs[group], -size / 2, -size / 2, size, size);
          }
          if (bridge > 0) {
            // Matching source image tiles retain the letterform's full coverage,
            // color and alpha. Add only during the short matching handoff.
            ctx.globalCompositeOperation = bridge < 1 ? 'lighter' : 'source-over';
            for (const tile of tiles[group]) {
              const progress = glide((travelTime - tile.delay) / .5);
              const alpha = bridge * (1 - phase(progress, .86, .14) * coinCoverage);
              if (alpha <= .001) continue;
              const targetCos = p.phaseCos * tile.phaseCos - p.phaseSin * tile.phaseSin;
              const targetSin = p.phaseSin * tile.phaseCos + p.phaseCos * tile.phaseSin;
              const rx = targetCos * yawCos + COIN_HALF_DEPTH * yawSin;
              const rz = -targetCos * yawSin + COIN_HALF_DEPTH * yawCos;
              const ry = targetSin * TILT_COS - rz * TILT_SIN;
              const depth = targetSin * TILT_SIN + rz * TILT_COS;
              const land = f.coinRadius * tile.landFactor;
              const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - depth);
              const targetX = centerX + rx * land * perspective, targetY = f.coinY + ry * land * perspective;
              const dx = targetX - p.x, dy = targetY - p.y;
              const targetLocalX = dx * cos + dy * sin, targetLocalY = -dx * sin + dy * cos;
              const x = mix(tile.x * p.size, targetLocalX, progress);
              const y = mix(tile.y * p.size, targetLocalY, progress);
              const size = mix(sourceSize, 1.5, progress);
              ctx.globalAlpha = mix(visibility, 1, progress) * alpha;
              ctx.drawImage(glyphs[group], tile.sx, tile.sy, TILE_SIZE, TILE_SIZE, x - size / 2, y - size / 2, size, size);
            }
          }
          ctx.restore();
        }
        // Retain the restrained traveling highlight of the original orbit scene.
        const glint = phase(t, 2.08, .24) * (1 - phase(t, 2.4, .16));
        if (glint > 0) {
          const a = (t - 2.08) * 4.2;
          ctx.save(); ctx.globalAlpha = glint * .6; ctx.strokeStyle = '#ffe7bd'; ctx.lineWidth = 1.25;
          ctx.beginPath();
          for (let i = 0; i <= 20; i++) {
            const point = projectedRim(a + i / 20 * .5, f.coinRadius, f.angle);
            if (i) ctx.lineTo(centerX + point.x, f.coinY + point.y); else ctx.moveTo(centerX + point.x, f.coinY + point.y);
          }
          ctx.stroke(); ctx.restore();
        }
      },
    };
  },
};
