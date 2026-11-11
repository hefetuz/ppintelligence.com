import {
  CAMERA_DISTANCE,
  COIN_HALF_DEPTH,
} from './coin-geometry';
import { drawCoinVectorFace } from './coin-vector-face';

export const COIN_TEXTURE_SIZE = 640;
export const COIN_TEXTURE_RADIUS = 300;
export const COIN_REST_ASSET = 'coin-rest.svg';
export const COIN_CURRENCIES = ['$', '€', '£', '¥', '₺', '₹'] as const;
export const COIN_SYMBOL_FONT = 'Consolas, "Segoe UI Symbol", monospace';

export type CoinTextures = {
  face: HTMLCanvasElement;
  reverse: HTMLCanvasElement;
  blankFace: HTMLCanvasElement;
  mintedFace: HTMLCanvasElement;
  lastMint: number;
};

export type CoinRenderPose = {
  x: number;
  y: number;
  radius: number;
  /** Hero-style rotation around the coin's vertical axis. */
  yaw: number;
  /** Independent clockwise rotation in the screen plane. */
  roll?: number;
};

export type CoinLighting = {
  alpha?: number;
  mint?: number;
  tilt?: number;
  reflection?: number;
  /** Layer thickness for the scroll cutaway; omitted keeps the original coin. */
  halfDepth?: number;
  /** Paper-and-ink construction drawing; the default hero remains metallic. */
  lineArt?: boolean;
  /**
   * Transparent blueprint construction. Values between 0 and 1 crossfade the
   * metal into strokes; 1 emits no fills, textures, or solid underpaint.
   */
  wireframe?: boolean | number;
  /** Opposite exterior cap in a separated coin shell. */
  vectorFace?: 'face' | 'reverse';
  /** 1 preserves the hero camera; 0 matches the orthographic illustration. */
  perspective?: number;
};

type BufferedCoinSurface = { segment: number; depth: number; fill: string };
const COIN_SEGMENTS = 64;
const COIN_CIRCLE = Array.from({ length: COIN_SEGMENTS + 1 }, (_, i) => {
  const angle = (i / COIN_SEGMENTS) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
});
const COIN_MID_NORMALS = Array.from({ length: COIN_SEGMENTS }, (_, i) => {
  const a = (i / COIN_SEGMENTS) * Math.PI * 2;
  const b = ((i + 1) / COIN_SEGMENTS) * Math.PI * 2;
  const angle = (a + b) / 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
});
const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const smoothstep = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};

/** The closed coin becomes a blueprint before the mechanism starts to split. */
export const coinWireframeProgress = (progress: number) =>
  smoothstep((progress - 0.12) / 0.22);

/** The same face selector is shared by metal and blueprint materials. */
export const coinVisibleFace = (yaw: number) =>
  Math.cos(yaw) >= 0 ? 'face' as const : 'reverse' as const;

const seeded = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function canvas() {
  const value = document.createElement('canvas');
  value.width = value.height = COIN_TEXTURE_SIZE;
  return value;
}

/** Builds the single shared Pretty Penny material used by every coin scene. */
export function createCoinTextures(logo?: CanvasImageSource): CoinTextures {
  const face = canvas(),
    reverse = canvas(),
    blankFace = canvas(),
    mintedFace = canvas();
  const c = face.getContext('2d');
  if (!c) return { face, reverse, blankFace, mintedFace, lastMint: -1 };
  const r = COIN_TEXTURE_RADIUS,
    cx = 320,
    cy = 320;
  c.clearRect(0, 0, 640, 640);
  const metal = c.createLinearGradient(70, 0, 560, 640);
  metal.addColorStop(0, '#f7ddb0');
  metal.addColorStop(0.25, '#be884d');
  metal.addColorStop(0.47, '#edc589');
  metal.addColorStop(0.72, '#9a6639');
  metal.addColorStop(1, '#dca66b');
  c.fillStyle = metal;
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fill();
  for (const [radius, alpha, thickness] of [
    [299, 0.9, 3],
    [284, 0.65, 2],
    [270, 0.55, 2],
    [239, 0.35, 1],
  ]) {
    c.strokeStyle = `rgba(255,231,191,${alpha})`;
    c.lineWidth = thickness;
    c.beginPath();
    c.arc(cx, cy, radius, 0, Math.PI * 2);
    c.stroke();
  }
  c.font = `10px ${COIN_SYMBOL_FONT}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (let y = -260; y <= 260; y += 12)
    for (let x = -260; x <= 260; x += 9) {
      if (Math.hypot(x, y) > 260) continue;
      c.fillStyle = `rgba(53,32,17,${0.11 + seeded(x + y * 71) * 0.15})`;
      c.fillText(
        COIN_CURRENCIES[Math.floor(seeded(x * 9 + y) * 6)],
        cx + x,
        cy + y,
      );
    }
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 70) {
    c.strokeStyle = 'rgba(72,39,15,.58)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 288, cy + Math.sin(a) * 288);
    c.lineTo(cx + Math.cos(a) * 297, cy + Math.sin(a) * 297);
    c.stroke();
  }
  blankFace.getContext('2d')?.drawImage(face, 0, 0);
  if (logo) {
    const stamp = document.createElement('canvas');
    stamp.width = stamp.height = 300;
    const s = stamp.getContext('2d');
    if (s) {
      s.drawImage(logo, 35, 24, 230, 250);
      s.globalCompositeOperation = 'source-in';
      s.fillStyle = '#62411e';
      s.fillRect(0, 0, 300, 300);
      c.globalAlpha = 0.85;
      c.drawImage(stamp, 170, 167);
      s.fillStyle = '#fce4ba';
      s.fillRect(0, 0, 300, 300);
      c.globalAlpha = 0.8;
      c.drawImage(stamp, 168, 164);
      c.globalAlpha = 1;
    }
  }
  c.font = `15px ${COIN_SYMBOL_FONT}`;
  c.fillStyle = 'rgba(66,39,18,.85)';
  const inscription = 'PRETTY PENNY • INTELLIGENCE • ';
  for (let i = 0; i < inscription.length; i++) {
    const a = -Math.PI / 2 + (i / inscription.length) * Math.PI * 2;
    c.save();
    c.translate(cx + Math.cos(a) * 252, cy + Math.sin(a) * 252);
    c.rotate(a + Math.PI / 2);
    c.fillText(inscription[i], 0, 0);
    c.restore();
  }
  const back = reverse.getContext('2d');
  if (back) {
    back.drawImage(face, 0, 0);
    const satin = back.createLinearGradient(80, 100, 540, 540);
    satin.addColorStop(0, '#d9b781');
    satin.addColorStop(0.5, '#ae7f4c');
    satin.addColorStop(1, '#ddba80');
    back.fillStyle = satin;
    back.beginPath();
    back.arc(320, 320, 237, 0, Math.PI * 2);
    back.fill();
    back.textAlign = 'center';
    back.textBaseline = 'middle';
    back.fillStyle = '#644321';
    back.font = '51px Georgia, serif';
    back.fillText('PRETTY', 320, 283);
    back.fillText('PENNY', 320, 343);
    back.font = `17px ${COIN_SYMBOL_FONT}`;
    back.fillText('INTELLIGENCE', 320, 397);
    back.fillStyle = 'rgba(255,234,197,.85)';
    back.font = '51px Georgia, serif';
    back.fillText('PRETTY', 318, 281);
    back.fillText('PENNY', 318, 341);
    back.font = `19px ${COIN_SYMBOL_FONT}`;
    COIN_CURRENCIES.forEach((symbol, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      back.fillText(symbol, 320 + Math.cos(a) * 196, 320 + Math.sin(a) * 196);
    });
  }
  // A completed coin must have a concrete minted surface as well as the
  // source face. Below-fold scenes begin at mint=1 and therefore never pass
  // through the hero's progressive mint branch before their first frame.
  mintedFace.getContext('2d')?.drawImage(face, 0, 0);
  return { face, reverse, blankFace, mintedFace, lastMint: 1 };
}

export function renderCoin(
  ctx: CanvasRenderingContext2D,
  textures: CoinTextures,
  pose: CoinRenderPose,
  lighting: CoinLighting = {},
) {
  const alpha = lighting.alpha ?? 1;
  const wireframe = clamp(
    typeof lighting.wireframe === 'number'
      ? lighting.wireframe
      : lighting.wireframe
        ? 1
        : 0,
  );
  const mint = lighting.mint ?? 1;
  const tilt = lighting.tilt ?? 0.17;
  const reflectionStrength = lighting.reflection ?? 0;
  const halfDepth = lighting.halfDepth ?? COIN_HALF_DEPTH;
  const lineArt = lighting.lineArt ?? false;
  const perspectiveStrength = clamp(lighting.perspective ?? 1);
  if (alpha <= 0 || pose.radius <= 0) return;
  // Keep the default metal path intact for the hero and use it as the fading
  // half of the handoff. The fully drawn state skips this branch altogether,
  // which guarantees that the blueprint has no opaque coin-shaped paint.
  if (wireframe > 0 && wireframe < 1) {
    renderCoin(ctx, textures, pose, {
      ...lighting,
      alpha: alpha * (1 - wireframe),
      wireframe: 0,
    });
  }
  if (mint < 1) {
    if (Math.abs(mint - textures.lastMint) > 0.001 || textures.lastMint < 0) {
      const m = textures.mintedFace.getContext('2d');
      if (m) {
        m.clearRect(0, 0, 640, 640);
        const fill = smoothstep((mint - 0.12) / 0.56);
        m.save();
        m.beginPath();
        m.arc(320, 320, 301, 0, Math.PI * 2);
        m.arc(
          320,
          320,
          Math.max(0.001, 280 * (1 - fill)),
          0,
          Math.PI * 2,
          true,
        );
        m.clip('evenodd');
        m.drawImage(textures.blankFace, 0, 0);
        m.restore();
        const seal = smoothstep((mint - 0.66) / 0.34);
        if (seal > 0) {
          m.save();
          m.globalAlpha = seal;
          m.drawImage(textures.face, 0, 0);
          m.restore();
        }
      }
      textures.lastMint = mint;
    }
  }
  const surfaces: BufferedCoinSurface[] = [];
  const yawCos = Math.cos(pose.yaw), yawSin = Math.sin(pose.yaw);
  const tiltCos = Math.cos(tilt), tiltSin = Math.sin(tilt);
  const project = (x: number, y: number, z: number) => {
    const rotatedX = x * yawCos + z * yawSin;
    const yawZ = -x * yawSin + z * yawCos;
    const rotatedY = y * tiltCos - yawZ * tiltSin;
    const rotatedZ = y * tiltSin + yawZ * tiltCos;
    // Camera distance tends to infinity as strength tends to zero. Keeping
    // projection and visibility on this same camera prevents cut-off shoulders.
    const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - rotatedZ * perspectiveStrength);
    return {
      x: pose.x + rotatedX * pose.radius * perspective,
      y: pose.y + rotatedY * pose.radius * perspective,
      z: rotatedZ,
    };
  };
  const frontRim = COIN_CIRCLE.map((point) => project(point.x, point.y, halfDepth));
  const backRim = COIN_CIRCLE.map((point) => project(point.x, point.y, -halfDepth));
  ctx.save();
  if (pose.roll) {
    ctx.translate(pose.x, pose.y);
    ctx.rotate(pose.roll);
    ctx.translate(-pose.x, -pose.y);
  }
  if (wireframe > 0) {
    const inkAlpha = alpha * wireframe;
    const trace = (points: typeof frontRim, opacity = 1) => {
      ctx.save();
      ctx.globalAlpha = inkAlpha * opacity;
      ctx.beginPath();
      for (let i = 0; i <= COIN_SEGMENTS; i++) {
        const point = points[i];
        if (i) ctx.lineTo(point.x, point.y);
        else ctx.moveTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#d8e7ff';
      ctx.lineWidth = Math.max(0.7, Math.min(1.35, pose.radius / 150));
      ctx.stroke();
      ctx.restore();
    };
    const side = coinVisibleFace(pose.yaw) === 'face' ? 1 : -1;
    const faceRim = side === 1 ? frontRim : backRim;
    const farRim = side === 1 ? backRim : frontRim;
    const faceVisible =
      side * yawCos * tiltCos * CAMERA_DISTANCE > halfDepth * perspectiveStrength;
    // Only the visible cap is complete. The rear edge appears solely along the
    // exposed side wall, matching the solid renderer's depth occlusion.
    if (faceVisible) trace(faceRim, 0.94);
    ctx.save();
    ctx.globalAlpha = inkAlpha * 0.52;
    ctx.strokeStyle = '#d8e7ff';
    ctx.lineWidth = Math.max(0.7, Math.min(1.05, pose.radius / 180));
    const wallVisible = (i: number) => {
      const unit = COIN_MID_NORMALS[i];
      const normalZ = unit.y * tiltSin - unit.x * yawSin * tiltCos;
      return normalZ * CAMERA_DISTANCE > perspectiveStrength;
    };
    // Each visible rear arc is one joined path with both ends attached to the
    // face. Sparse ribs always meet both projected rims, so no strokes float.
    ctx.beginPath();
    let wallOpen = false;
    for (let i = 0; i < COIN_SEGMENTS; i++) {
      const visible = wallVisible(i);
      if (visible && !wallOpen) {
        ctx.moveTo(faceRim[i].x, faceRim[i].y);
        ctx.lineTo(farRim[i].x, farRim[i].y);
        wallOpen = true;
      }
      if (visible) ctx.lineTo(farRim[i + 1].x, farRim[i + 1].y);
      if (visible && (!wallVisible((i + 1) % COIN_SEGMENTS) || i === COIN_SEGMENTS - 1)) {
        ctx.lineTo(faceRim[i + 1].x, faceRim[i + 1].y);
        wallOpen = false;
      }
    }
    ctx.stroke();
    for (let i = 0; i < COIN_SEGMENTS; i += 8) {
      if (!wallVisible(i)) continue;
      ctx.beginPath();
      ctx.moveTo(farRim[i].x, farRim[i].y);
      ctx.lineTo(faceRim[i].x, faceRim[i].y);
      ctx.stroke();
    }
    ctx.restore();
    if (faceVisible) {
      const origin = project(0, 0, side * halfDepth);
      const xp = project(side, 0, side * halfDepth),
        xm = project(-side, 0, side * halfDepth);
      const yp = project(0, 1, side * halfDepth),
        ym = project(0, -1, side * halfDepth);
      const a = (xp.x - xm.x) / 600,
        b = (xp.y - xm.y) / 600,
        c = (yp.x - ym.x) / 600,
        d = (yp.y - ym.y) / 600,
        tx = origin.x - 320 * (a + c),
        ty = origin.y - 320 * (b + d);
      ctx.save();
      ctx.globalAlpha = inkAlpha;
      ctx.beginPath();
      for (let i = 0; i <= COIN_SEGMENTS; i++) {
        const point = faceRim[i];
        if (i) ctx.lineTo(point.x, point.y);
        else ctx.moveTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.clip();
      ctx.transform(a, b, c, d, tx, ty);
      const faceKey = lighting.vectorFace ?? (mint < 1 ? 'face' : coinVisibleFace(pose.yaw));
      drawCoinVectorFace(ctx, faceKey, Math.max(.9, 300 / pose.radius), mint, inkAlpha);
      ctx.restore();
    }
    ctx.restore();
    return;
  }
  for (let i = 0; i < COIN_SEGMENTS; i++) {
    const unit = COIN_MID_NORMALS[i];
    const normalX = unit.x * yawCos;
    const yawZ = -unit.x * yawSin;
    const normalY = unit.y * tiltCos - yawZ * tiltSin;
    const normalZ = unit.y * tiltSin + yawZ * tiltCos;
    if (normalZ * CAMERA_DISTANCE <= perspectiveStrength) continue;
    const p0 = backRim[i], p1 = backRim[i + 1], p2 = frontRim[i + 1], p3 = frontRim[i];
    const lit = clamp(normalX * -0.45 + normalY * -0.5 + normalZ * 0.74);
    const reed = i % 2 ? 0.84 : 1;
    const r = Math.round((114 + lit * 112) * reed),
      g = Math.round((72 + lit * 107) * reed),
      blue = Math.round((35 + lit * 80) * reed);
    surfaces.push({
      segment: i,
      depth: (p0.z + p1.z + p2.z + p3.z) / 4,
      fill: lineArt ? ['#d8d1c3','#e2dbcd','#ebe5d9','#f0ebdf'][Math.min(3, Math.floor(lit * 4))] : `rgb(${r},${g},${blue})`,
    });
  }
  surfaces.sort((a, b) => a.depth - b.depth);
  ctx.globalAlpha = alpha;
  const expandedPoint = (point: { x: number; y: number }, move: boolean, midX: number, midY: number) => {
    const distance = Math.hypot(point.x - midX, point.y - midY) || 1;
    const x = point.x + ((point.x - midX) / distance) * 0.22;
    const y = point.y + ((point.y - midY) / distance) * 0.22;
    if (move) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  };
  for (const surface of surfaces) {
    const n = surface.segment;
    const p0 = backRim[n], p1 = backRim[n + 1], p2 = frontRim[n + 1], p3 = frontRim[n];
    const midX = (p0.x + p1.x + p2.x + p3.x) / 4;
    const midY = (p0.y + p1.y + p2.y + p3.y) / 4;
    ctx.beginPath();
    expandedPoint(p0, true, midX, midY);
    expandedPoint(p1, false, midX, midY);
    expandedPoint(p2, false, midX, midY);
    expandedPoint(p3, false, midX, midY);
    ctx.closePath();
    ctx.fillStyle = surface.fill;
    ctx.fill();
    if (lineArt && n % 2 === 0) {
      ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p3.x,p3.y);
      ctx.strokeStyle = '#8b8375'; ctx.lineWidth = .45; ctx.stroke();
    }
  }
  for (const side of [1, -1]) {
    if (side * yawCos * tiltCos * CAMERA_DISTANCE <= halfDepth * perspectiveStrength) continue;
    // A solid metal cap joins the true projected rim to the affine face texture.
    // Without it, oblique angles expose a crescent of the scene background.
    ctx.save(); ctx.beginPath();
    const faceRim = side === 1 ? frontRim : backRim;
    for (let i = 0; i <= COIN_SEGMENTS; i++) {
      const p = faceRim[i];
      if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
    }
    ctx.closePath(); ctx.fillStyle = lineArt ? '#eee8dc' : '#825623'; ctx.fill(); ctx.restore();
    const origin = project(0, 0, side * halfDepth);
    const xp = project(side, 0, side * halfDepth),
      xm = project(-side, 0, side * halfDepth);
    const yp = project(0, 1, side * halfDepth),
      ym = project(0, -1, side * halfDepth);
    const a = (xp.x - xm.x) / 600,
      b = (xp.y - xm.y) / 600;
    const c = (yp.x - ym.x) / 600,
      d = (yp.y - ym.y) / 600;
    const tx = origin.x - 320 * (a + c),
      ty = origin.y - 320 * (b + d);
    ctx.save();
    ctx.beginPath();
    for (let i=0;i<=COIN_SEGMENTS;i++) { const p=faceRim[i]; if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y); }
    ctx.closePath();ctx.clip();
    ctx.transform(a, b, c, d, tx, ty);
    ctx.drawImage(
      mint < 1 ? textures.mintedFace : textures[coinVisibleFace(pose.yaw)],
      0,
      0,
    );
    ctx.restore();
    if (lineArt) {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let i=0;i<=COIN_SEGMENTS;i++) { const p=faceRim[i]; if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y); }
      ctx.closePath(); ctx.strokeStyle='#706b60';ctx.lineWidth=.75;ctx.stroke();ctx.restore();
      continue;
    }
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= COIN_SEGMENTS; i++) {
      const unit = COIN_CIRCLE[i];
      const u = 320 + unit.x * 300,
        v = 320 + unit.y * 300;
      const p = {
        x: ((xp.x - xm.x) / 600) * u + c * v + tx,
        y: b * u + d * v + ty,
      };
      if (i) ctx.lineTo(p.x, p.y);
      else ctx.moveTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.clip();
    const normalX = side * yawSin;
    const normalY = -side * yawCos * tiltSin;
    const normalZ = side * yawCos * tiltCos;
    const light = clamp(normalX * -0.4 + normalY * -0.45 + normalZ * 0.8);
    ctx.globalAlpha = alpha * smoothstep((mint - 0.6) / 0.4);
    ctx.fillStyle = `rgba(29,20,12,${(1 - light) * 0.28})`;
    ctx.fillRect(
      pose.x - pose.radius * 1.3,
      pose.y - pose.radius * 1.3,
      pose.radius * 2.6,
      pose.radius * 2.6,
    );
    const sweep = Math.sin(pose.yaw) * pose.radius * 0.85;
    const reflection = ctx.createLinearGradient(
      pose.x - pose.radius + sweep,
      pose.y - pose.radius,
      pose.x + pose.radius + sweep,
      pose.y + pose.radius * 0.4,
    );
    reflection.addColorStop(0, 'transparent');
    reflection.addColorStop(0.34, 'transparent');
    reflection.addColorStop(0.46, 'rgba(255,240,207,.03)');
    reflection.addColorStop(
      0.53,
      `rgba(255,240,207,${0.29 + reflectionStrength * 0.11})`,
    );
    reflection.addColorStop(0.6, 'rgba(255,240,207,.06)');
    reflection.addColorStop(0.77, 'transparent');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = reflection;
    ctx.fillRect(
      pose.x - pose.radius * 1.3,
      pose.y - pose.radius * 1.3,
      pose.radius * 2.6,
      pose.radius * 2.6,
    );
    ctx.restore();
  }
  ctx.restore();
}
