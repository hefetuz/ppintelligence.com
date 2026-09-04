import { bezier, clamp, enter, mix, phase, spinAngle, TAU } from './motion';
import type { HandSource, IntroDefinition, IntroEnvironment, IntroFrame, Point } from './types';

export function handsFrame(t: number, e: IntroEnvironment): IntroFrame {
  const transfer = phase(t, 3.25, 1.25);
  return {
    // Here the hands are the origin: the coin is born at its final position.
    coinY: e.sceneY, coinRadius: mix(e.radius * 1.36, e.radius, transfer),
    coinAlpha: phase(t, 1.95, .55), mint: phase(t, 2.02, 1.35),
    angle: spinAngle(t, 3.04), hands: mix(.38, 1, phase(t, .1, 1.15)),
    handLight: phase(t, 1.6, 2.05), transfer,
  };
}

function streamPoint(p: HandSource, tip: Point, side: number, progress: number, e: IntroEnvironment, radius: number) {
  const direction = side ? -1 : 1;
  const theta = p.seed * TAU * .68 + (side ? 0 : Math.PI);
  const endX = e.width / 2 + Math.cos(theta) * radius * .97;
  const endY = e.sceneY + Math.sin(theta) * radius * .97;
  return {
    x: bezier(p.x, mix(p.x, tip.x, .66), tip.x + direction * radius * .6, endX, progress),
    y: bezier(p.y, p.y - 36 - p.seed * 28, tip.y - 48 + p.seed * 54, endY, progress),
  };
}

export const handsIntro: IntroDefinition = {
  id: 'hands', title: 'Ellerden Doğan Coin', shortTitle: 'Ellerden doğuş',
  caption: 'Human insight. Tangible value.',
  description: 'Ellerdeki para işaretleri parmaklardan akarak merkezde buluşur; coin doğarken elleri sıcak ışık aydınlatır.',
  branch: 'intro/hands-origin', duration: 4.65, releaseAt: 4.1,
  create() {
    return {
      frame: handsFrame,
      draw(ctx, t, e, f) {
        if (t >= 4.1) return;
        const birthRadius = e.radius * 1.36;
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        for (const side of [0, 1]) {
          const tip = e.fingertips[side];
          const pulse = phase(t, .4, .75) * (1 - phase(t, 2.5, .8));
          // Warmth sits on the fingertips; there is no full-screen flash.
          if (pulse > 0) {
            const light = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, birthRadius * .85);
            light.addColorStop(0, 'rgba(222,178,112,' + pulse * .12 + ')'); light.addColorStop(1, 'transparent');
            ctx.fillStyle = light; ctx.fillRect(tip.x - birthRadius, tip.y - birthRadius, birthRadius * 2, birthRadius * 2);
          }
          for (const p of e.handSources[side]) {
            if (p.x < 12 || p.x > e.width - 12) continue;
            const start = .4 + p.seed * 1.15;
            const travelTime = 1.2 + p.seed * .38;
            const progress = clamp((t - start) / travelTime);
            if (t < start || t > start + travelTime + .75) continue;
            const alpha = enter((t - start) / .3) * (1 - phase(t, start + travelTime + .05, .6));
            const head = streamPoint(p, tip, side, progress, e, birthRadius);
            // Two short echoes give direction without a persistent smoke cloud.
            for (let trail = 2; trail >= 0; trail--) {
              const q = trail ? streamPoint(p, tip, side, clamp(progress - trail * .022), e, birthRadius) : head;
              const size = mix(5.2, 9.4, Math.sin(progress * Math.PI)) * (e.width < 760 ? .86 : 1);
              ctx.globalAlpha = alpha * (trail ? .09 : .48 + p.tone * .35);
              ctx.drawImage(e.sprite, p.symbol * 16, 0, 16, 16, q.x - size / 2, q.y - size / 2, size, size);
            }
          }
        }
        ctx.globalAlpha = 1;
        // The two streams leave a readable outline before the surface solidifies.
        const rim = phase(t, 1.65, .6) * (1 - phase(t, 2.7, .6));
        if (rim > 0) {
          for (let i = 0; i < 72; i++) {
            const a = i / 72 * TAU + t * .2;
            const radius = f.coinRadius * (1 + Math.sin(i * 2.3 + t) * .014);
            const x = e.width / 2 + Math.cos(a) * radius;
            const y = e.sceneY + Math.sin(a) * radius;
            ctx.globalAlpha = rim * (.35 + Math.sin(a - t) * .18);
            ctx.drawImage(e.sprite, (i % 6) * 16, 0, 16, 16, x - 2, y - 2, 4, 4);
          }
        }
        ctx.restore();
      },
    };
  },
};
