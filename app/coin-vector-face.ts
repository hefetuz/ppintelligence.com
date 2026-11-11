export type CoinVectorFace = 'face' | 'reverse';

/** Exact path from the revised public/pp-logo.svg (731 × 731 viewBox). */
export const PP_LOGO_PATH = 'M142.821 0H387C508.321 0 592.786 43 592.786 135.143C592.786 153.571 590.482 172 586.643 187.357C672.643 195.036 731 238.036 731 324.036C731 456.107 626.571 568.214 483.75 583.571L414.643 684.929L394.679 580.5L310.214 539.036L406.964 503.714L488.357 394.679L505.25 499.107C585.107 486.821 641.929 416.179 641.929 339.393C641.929 284.107 598.929 264.143 534.429 264.143H350.143L228.821 731H139.75L281.804 184.286H502.179C503.714 175.071 503.714 165.857 503.714 156.643C503.714 101.357 469.929 79.8571 390.071 79.8571H210.393L89.0714 546.714H0L142.821 0Z';

/** The revised mark is one clean closed contour. */
export const PP_LOGO_OUTLINE_PATH = PP_LOGO_PATH;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export function drawCoinVectorFace(
  ctx: CanvasRenderingContext2D,
  face: CoinVectorFace,
  lineWidth: number,
  mint = 1,
  alpha = 1,
) {
  ctx.save();
  ctx.strokeStyle = '#d8e7ff';
  ctx.lineWidth = lineWidth;
  if (mint < 1) {
    const reveal = smoothstep((mint - .12) / .56);
    ctx.beginPath();
    ctx.arc(320, 320, 301, 0, Math.PI * 2);
    ctx.arc(320, 320, Math.max(.001, 280 * (1 - reveal)), 0, Math.PI * 2, true);
    ctx.clip('evenodd');
  }
  for (const radius of [284, 270, 239]) {
    ctx.beginPath();
    ctx.arc(320, 320, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (face === 'face') {
    const seal = mint < 1 ? smoothstep((mint - .66) / .34) : 1;
    if (seal > 0 && typeof Path2D === 'function') {
      ctx.save();
      ctx.globalAlpha = alpha * seal;
      ctx.translate(203, 188);
      ctx.scale(230 / 731, 250 / 731);
      ctx.lineWidth = lineWidth * 2.05;
      ctx.stroke(new Path2D(PP_LOGO_OUTLINE_PATH));
      ctx.restore();
    }
  } else {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '51px Georgia, serif';
    ctx.strokeText('PRETTY', 320, 283);
    ctx.strokeText('PENNY', 320, 343);
    ctx.font = '17px Consolas, "Segoe UI Symbol", monospace';
    ctx.strokeText('INTELLIGENCE', 320, 397);
  }
  ctx.restore();
}
