import { bezier, enter, mix, phase, spinAngle, TAU } from './motion';
import type { IntroDefinition, IntroEnvironment, IntroFrame, Point } from './types';

type Segment = [number, number, number, number, number, number, number, number];
const line = (x: number, y: number, a: number, b: number): Segment => [x, y, mix(x, a, 1 / 3), mix(y, b, 1 / 3), mix(x, a, 2 / 3), mix(y, b, 2 / 3), a, b];

// Equal-distance samples keep all three strokes connected during the morph.
// These are currency letterforms, not particle-cloud substitutions or crossfades.
export function resample(segments: Segment[], count = 100): Point[] {
  const raw: Point[] = [], distance: number[] = [];
  let total = 0;
  for (const segment of segments) for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    const p = { x: bezier(segment[0], segment[2], segment[4], segment[6], t), y: bezier(segment[1], segment[3], segment[5], segment[7], t) };
    if (raw.length) total += Math.hypot(p.x - raw[raw.length - 1].x, p.y - raw[raw.length - 1].y);
    raw.push(p); distance.push(total);
  }
  let index = 1;
  return Array.from({ length: count }, (_, i) => {
    const target = total * i / (count - 1);
    while (index < distance.length - 1 && distance[index] < target) index++;
    const p = raw[index - 1], q = raw[index];
    const fraction = (target - distance[index - 1]) / Math.max(.00001, distance[index] - distance[index - 1]);
    return { x: mix(p.x, q.x, fraction), y: mix(p.y, q.y, fraction) };
  });
}

const dollar = [
  resample([[.58, -.59, -.72, -1.33, -.99, -.09, -.03, -.02], [-.03, -.02, .95, .08, .7, 1.19, -.62, .64]]),
  resample([line(-.1, -1.05, -.1, 1.04)]),
  resample([line(.1, -1.05, .1, 1.04)]),
];
const euro = [
  resample([[.64, -.7, -.95, -1.49, -1.02, 1.42, .65, .7]]),
  resample([line(-.8, -.16, .37, -.16)]),
  resample([line(-.8, .13, .28, .13)]),
];
const pound = [
  resample([[.57, -.62, .26, -1.18, -.83, -.88, -.45, -.02], [-.45, -.02, -.27, .38, -.37, .68, -.69, .85]]),
  resample([line(-.69, .85, .69, .85)]),
  resample([line(-.74, .08, .23, .08)]),
];
const rings = [1, .927, .852].map((radius, j) => Array.from({ length: 100 }, (_, i) => {
  const a = -Math.PI / 2 + j * .18 + i / 99 * TAU;
  return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
}));

export function morphFrame(t: number, e: IntroEnvironment): IntroFrame {
  const transfer = phase(t, 3.6, 1.15);
  return {
    coinY: mix(e.height * .4, e.sceneY, transfer),
    coinRadius: mix(e.radius * (e.width < 760 ? 2.1 : 2.2), e.radius, transfer),
    coinAlpha: phase(t, 2.96, .36), mint: phase(t, 3.05, .66),
    angle: spinAngle(t, 3.38), hands: phase(t, 3.52, 1.2),
    handLight: phase(t, 3.62, .7), transfer,
  };
}

export const morphIntro: IntroDefinition = {
  id: 'morph', title: 'Kesintisiz Dönüşüm', shortTitle: 'Dönüşüm',
  caption: 'A different perspective. A clearer possibility.',
  description: 'Tek bir metalik biçim dolar, euro ve sterline dönüşür; çizgiler halkaya kıvrılıp coin’i oluşturur.',
  branch: 'intro/continuous-morph', duration: 4.85, releaseAt: 4.4,
  create() {
    return {
      frame: morphFrame,
      draw(ctx, t, e, f) {
        const opacity = enter(t / .45) * (1 - phase(t, 3.13, .4));
        if (opacity <= 0) return;
        const a = phase(t, .68, .65), b = phase(t, 1.54, .66), curl = phase(t, 2.4, .78);
        const breathing = 1 + Math.sin(t * 1.1) * .018 * (1 - curl);
        const size = f.coinRadius * mix(1.07, 1, curl) * breathing;
        const points = dollar.map((stroke, j) => stroke.map((p, i) => {
          const x = mix(mix(p.x, euro[j][i].x, a), pound[j][i].x, b);
          const y = mix(mix(p.y, euro[j][i].y, a), pound[j][i].y, b);
          return { x: mix(x, rings[j][i].x, curl), y: mix(y, rings[j][i].y, curl) };
        }));
        ctx.save(); ctx.globalAlpha = opacity;
        ctx.translate(e.width / 2, f.coinY);
        const rotation = -.05 * (1 - curl) + Math.sin(t * .9) * .025 * (1 - curl);
        ctx.rotate(rotation);
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        const metal = ctx.createLinearGradient(-size, -size, size, size);
        metal.addColorStop(0, '#8c653b'); metal.addColorStop(.2, '#f9e4bd'); metal.addColorStop(.43, '#ddbc8a'); metal.addColorStop(.68, '#916335'); metal.addColorStop(1, '#ead0a5');
        const trace = (stroke: Point[]) => {
          ctx.beginPath(); stroke.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x * size, p.y * size); else ctx.lineTo(p.x * size, p.y * size); });
        };
        const thickness = mix(size * .085, size * .017, curl);
        for (const stroke of points) {
          ctx.save(); ctx.translate(2.1, 2.8); trace(stroke); ctx.lineWidth = thickness + 2; ctx.strokeStyle = '#6c4627'; ctx.stroke(); ctx.restore();
          trace(stroke); ctx.lineWidth = thickness; ctx.strokeStyle = metal; ctx.stroke();
          ctx.save(); ctx.translate(-thickness * .19, -thickness * .19); trace(stroke); ctx.lineWidth = Math.max(.65, thickness * .15); ctx.strokeStyle = 'rgba(255,243,214,.68)'; ctx.stroke(); ctx.restore();
        }
        ctx.restore();
      },
    };
  },
};
