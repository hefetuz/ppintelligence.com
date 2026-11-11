import { CURRENCY_SYMBOLS } from './currency-symbols';

/** One small cached currency atlas. The existing coin canvas owns the clock. */
export function createCoinAsciiDecode() {
  const atlas = document.createElement('canvas');
  atlas.width = atlas.height = 128;
  const ctx = atlas.getContext('2d', { willReadFrequently: true });
  let ready = false;
  return {
    snapshot(source: HTMLCanvasElement) {
      if (ready || !ctx) return;
      ctx.clearRect(0, 0, 128, 128);
      ctx.drawImage(source, 0, 0, 128, 128);
      const pixels = ctx.getImageData(0, 0, 128, 128).data;
      ctx.clearRect(0, 0, 128, 128);
      ctx.font = '400 10px "Geist Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#8b7351';
      for (let y = 4; y < 128; y += 8) for (let x = 4; x < 128; x += 8) {
        const i = (y * 128 + x) * 4;
        if (pixels[i + 3] < 20) continue;
        ctx.globalAlpha = Math.max(.3, 1 - (pixels[i] + pixels[i+1] + pixels[i+2]) / 900);
        ctx.fillText(CURRENCY_SYMBOLS[((x + y * 3) / 8 | 0) % CURRENCY_SYMBOLS.length], x, y);
      }
      ctx.globalAlpha = 1; ready = true;
    },
    draw(target: CanvasRenderingContext2D, x: number, y: number, radius: number, progress: number) {
      if (!ready || progress >= 1) return;
      const p = Math.max(0, progress), side = radius * 2.56;
      target.save();
      target.beginPath(); target.arc(x, y, radius * 1.1 * (1-p), 0, Math.PI*2); target.clip();
      target.globalAlpha *= Math.min(1, p * 12) * (1-p*.65);
      target.drawImage(atlas, x-side/2, y-side/2, side, side);
      target.restore();
    },
    destroy() {atlas.width = atlas.height = 1; ready = false;},
  };
}
