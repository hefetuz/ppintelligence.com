import { clamp, glide, enter, mix, phase, projectedRim, seeded, spinAngle, TAU } from './motion';
import type { IntroDefinition, IntroEnvironment, IntroFrame } from './types';

const SYMBOLS = ['$', '€', '£', '¥', '₺', '₹'];
type Grain = { x: number; y: number; group: number; seed: number };

export function orbitFrame(t: number, e: IntroEnvironment): IntroFrame {
  const transfer = phase(t, 3.45, 1.3);
  return {
    coinY: mix(e.introY ?? e.height * .4, e.sceneY, transfer),
    coinRadius: mix(Math.min(e.introMaxRadius ?? Infinity, e.radius * (e.width < 760 ? 1.85 : 2.05)), e.radius, transfer),
    coinAlpha: phase(t, 2.22, .4), mint: phase(t, 2.25, 1.12),
    angle: spinAngle(t, 3.08), hands: phase(t, 3.35, 1.4),
    handLight: phase(t, 3.4, .85), transfer,
  };
}

export const orbitIntro: IntroDefinition = {
  id: 'orbit', title: 'Yörüngeden Darphaneye', shortTitle: 'Yörünge',
  caption: 'Many possibilities. One clear direction.',
  description: 'Büyük para sembolleri yörüngeden ayrılır; spiral akış coin’in kenarına, yüzeyine ve PP damgasına dönüşür.',
  branch: 'intro/orbit-mint', duration: 4.85, releaseAt: 4.42,
  create() {
    let preparedWidth = 0;
    let grains: Grain[] = [];
    let glyphs: HTMLCanvasElement[] = [];
    const prepare = (e: IntroEnvironment) => {
      if (preparedWidth === e.width) return;
      preparedWidth = e.width; grains = [];
      glyphs = SYMBOLS.map((symbol, group) => {
        const image = document.createElement('canvas'); image.width = image.height = 256;
        const c = image.getContext('2d', { willReadFrequently: true });
        if (!c) return image;
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '208px "Instrument Serif", Georgia, serif';
        const metal = c.createLinearGradient(32, 24, 210, 242);
        metal.addColorStop(0, '#fff0d5'); metal.addColorStop(.34, '#d6b580'); metal.addColorStop(.68, '#926b3e'); metal.addColorStop(1, '#edd0a1');
        c.fillStyle = metal; c.fillText(symbol, 128, 128);
        const data = c.getImageData(0, 0, 256, 256).data;
        for (let y = 0; y < 256; y += 4) for (let x = 0; x < 256; x += 4) {
          if (data[(y * 256 + x) * 4 + 3] < 90) continue;
          grains.push({ x: (x - 128) / 208, y: (y - 128) / 208, group, seed: seeded(x + y * 173 + group * 1709) });
        }
        return image;
      });
    };
    const placement = (group: number, t: number, e: IntroEnvironment) => {
      const a = group / 6 * TAU - Math.PI * .69 + t * .22;
      const depth = Math.sin(a + .7), perspective = 1 + depth * .14;
      return {
        x: e.width / 2 + Math.cos(a) * e.width * .31,
        y: (e.introY ?? e.height * .4) + Math.sin(a) * Math.min(e.height * .16, e.introMaxRadius ?? 175),
        size: clamp(e.width * .164, 90, 218) * perspective,
        rotation: Math.cos(a) * .2 + t * .025,
        depth,
      };
    };
    return {
      frame: orbitFrame,
      draw(ctx, t, e, f) {
        prepare(e);
        const centerX = e.width / 2, centerY = e.introY ?? e.height * .4;
        const largeRadius = Math.min(e.introMaxRadius ?? Infinity, e.radius * (e.width < 760 ? 1.85 : 2.05));
        // Order whole glyphs by depth before they shed their engraved material.
        const order = SYMBOLS.map((_, i) => i).sort((a, b) => placement(a, t, e).depth - placement(b, t, e).depth);
        for (const i of order) {
          const dissolve = phase(t, 1.04 + i * .035, .42);
          const alpha = enter((t - i * .045) / .45) * (1 - dissolve);
          if (alpha <= .001) continue;
          const p = placement(i, t, e);
          ctx.save(); ctx.globalAlpha = alpha * (.8 + p.depth * .15); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
          const size = p.size * 256 / 208;
          ctx.drawImage(glyphs[i], -size / 2, -size / 2, size, size); ctx.restore();
        }
        if (t > 1 && t < 3.42) {
          ctx.save(); ctx.globalCompositeOperation = 'screen';
          for (const p of grains) {
            const start = 1.04 + p.group * .035;
            const gather = glide((t - start - p.seed * .12) / 1.72);
            const home = placement(p.group, start + .32 * (1 - Math.exp(-Math.max(0, t - start) / .32)), e);
            const x = home.x + (p.x * Math.cos(home.rotation) - p.y * Math.sin(home.rotation)) * home.size;
            const y = home.y + (p.x * Math.sin(home.rotation) + p.y * Math.cos(home.rotation)) * home.size;
            const a = Math.atan2(y - centerY, x - centerX);
            const travel = a + TAU * (.72 + p.seed * .14) * gather;
            const startRadius = Math.hypot(x - centerX, y - centerY);
            const land = largeRadius * (.93 + p.seed * .055);
            const radius = mix(startRadius, land, gather);
            const rim = projectedRim(travel, land, f.angle);
            const dock = phase(gather, .72, .28);
            const px = centerX + mix(Math.cos(travel) * radius, rim.x, dock);
            const py = mix(centerY + Math.sin(travel) * radius, f.coinY + rim.y, dock);
            const alpha = phase(t, start, .35) * (1 - phase(gather, .79, .21));
            const size = mix(home.size / 52 * 1.5, 3.1, gather);
            ctx.globalAlpha = alpha * (.45 + p.seed * .5);
            ctx.drawImage(e.sprite, p.group * 16, 0, 16, 16, px - size / 2, py - size / 2, size, size);
          }
          ctx.restore();
        }
        // One narrow specular arc travels around the newly milled edge.
        const glint = phase(t, 2.3, .3) * (1 - phase(t, 3.45, .35));
        if (glint > 0) {
          const a = (t - 2.3) * 3.4;
          ctx.save(); ctx.globalAlpha = glint * .6; ctx.strokeStyle = '#ffe7bd'; ctx.lineWidth = 1.25;
          ctx.beginPath();
          for (let i = 0; i <= 20; i++) { const p = projectedRim(a + i / 20 * .5, f.coinRadius, f.angle); if (i) ctx.lineTo(centerX + p.x, f.coinY + p.y); else ctx.moveTo(centerX + p.x, f.coinY + p.y); }
          ctx.stroke(); ctx.restore();
        }
      },
    };
  },
};
