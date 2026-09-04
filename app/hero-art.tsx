'use client';

import { useEffect, useRef } from 'react';

type CoinPoint = { x: number; y: number; z: number; nx: number; nz: number; rim: boolean; engraving: boolean };
const CURRENCIES = ['$', '€', '£', '¥', '₺', '₹', '₩', '₿'];
const SYMBOL_FONT = 'Consolas, "DejaVu Sans Mono", "Segoe UI Symbol", monospace';

// A shallow cylinder with two engraved faces and a reeded edge.
function makeCoin(logo?: Uint8ClampedArray, logoSize = 128): CoinPoint[] {
  const result: CoinPoint[] = [];
  for (const side of [-1, 1]) {
    for (let y = -.98; y <= .98; y += .047) {
      for (let x = -.98; x <= .98; x += .047) {
        const radius = Math.hypot(x, y);
        if (radius > 1) continue;
        const ring = Math.abs(radius - .82) < .025;
        // Mirror the back-face sampling so the supplied PP mark reads correctly on both sides.
        const lx = Math.floor((x * side / 1.16 + .5) * logoSize);
        const ly = Math.floor((y / 1.16 + .5) * logoSize);
        const emblem = logo && lx >= 0 && lx < logoSize && ly >= 0 && ly < logoSize
          ? logo[(ly * logoSize + lx) * 4 + 3] > 128 : false;
        result.push({ x, y, z: side * .115, nx: 0, nz: side, rim: radius > .93, engraving: ring || emblem });
      }
    }
  }
  for (let angle = 0; angle < Math.PI * 2; angle += .035) {
    for (let z = -.115; z <= .116; z += .046) {
      result.push({ x: Math.cos(angle), y: Math.sin(angle), z, nx: Math.cos(angle), nz: 0, rim: true, engraving: Math.floor(angle / .07) % 2 === 0 });
    }
  }
  return result;
}


type HandPoint = { x: number; y: number; alpha: number; glyph: string; side: number; seed: number };
type IntroAnchor = { x: number; y: number; size: number; glyph: string; rotation: number };
type Props = { animate: boolean; skipIntro: boolean; onIntroComplete: () => void };

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

export default function HeroArt({ animate, skipIntro, onIntroComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ animate, skipIntro, onIntroComplete });
  const pointer = useRef({ x: -1000, y: -1000, active: false });
  useEffect(() => { options.current = { animate, skipIntro, onIntroComplete }; }, [animate, skipIntro, onIntroComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) { options.current.onIntroComplete(); return; }
    const source = new Image(), logo = new Image();
    let coin = makeCoin();
    let width = 0, height = 0, dpr = 1, cell = 4, sceneY = 0;
    let frame = 0, last = 0, elapsed = 0, intro = 0, coinAngle = .25;
    let loaded = false, disposed = false, completed = false, intersecting = true;
    let points: HandPoint[] = [], cloud: { x: number; y: number }[] = [], anchors: IntroAnchor[] = [];
    let layers: HTMLCanvasElement[] = [];
    const overscan = 96;
    const illuminated = document.createElement('canvas');
    const lightCtx = illuminated.getContext('2d');
    const smooth = { x: -1000, y: -1000, strength: 0, hover: 0 };
    const complete = () => {
      if (completed) return;
      completed = true; intro = 3.2; options.current.onIntroComplete();
    };
    // An unavailable asset must never trap the visitor behind the introduction.
    const failSafe = window.setTimeout(complete, 5500);

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      width = box.width; height = box.height;
      if (!width || !height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      illuminated.width = canvas.width; illuminated.height = canvas.height;
      sceneY = height * (width < 640 ? .76 : .73);
      const big = Math.min(width * .17, 190);
      anchors = [
        {x: width * .2, y: height * .33, size: big, glyph: '$', rotation: -.16},
        {x: width * .51, y: height * .3, size: big * 1.2, glyph: '€', rotation: .1},
        {x: width * .81, y: height * .38, size: big * .9, glyph: '£', rotation: .18},
        {x: width * .19, y: height * .65, size: big * .9, glyph: '₺', rotation: .13},
        {x: width * .48, y: height * .68, size: big * 1.08, glyph: '¥', rotation: -.13},
        {x: width * .8, y: height * .68, size: big, glyph: '₹', rotation: -.18},
      ];
      const cloudCanvas = document.createElement('canvas');
      cloudCanvas.width = Math.round(width / 3); cloudCanvas.height = Math.round(height / 3);
      const cloudCtx = cloudCanvas.getContext('2d', { willReadFrequently: true });
      cloud = [];
      if (cloudCtx) {
        cloudCtx.scale(1 / 3, 1 / 3);
        cloudCtx.textAlign = 'center'; cloudCtx.textBaseline = 'middle'; cloudCtx.fillStyle = '#fff';
        for (const a of anchors) {
          cloudCtx.save(); cloudCtx.translate(a.x, a.y); cloudCtx.rotate(a.rotation);
          cloudCtx.font = '500 ' + a.size + 'px ' + SYMBOL_FONT; cloudCtx.fillText(a.glyph, 0, 0); cloudCtx.restore();
        }
        const pixels = cloudCtx.getImageData(0, 0, cloudCanvas.width, cloudCanvas.height).data;
        for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 100) cloud.push({ x: (i / 4 % cloudCanvas.width) * 3, y: Math.floor(i / 4 / cloudCanvas.width) * 3 });
      }
      if (!loaded) return;
      const artWidth = width < 640 ? width * 1.5 : Math.min(width * 1.08, height * 2.1);
      cell = width < 640 ? 3.4 : Math.max(3.5, artWidth / 340);
      const sample = document.createElement('canvas');
      sample.width = Math.round(artWidth / cell); sample.height = Math.round(sample.width * source.height / source.width);
      const sc = sample.getContext('2d', { willReadFrequently: true });
      if (!sc) return;
      sc.drawImage(source, 0, 0, sample.width, sample.height);
      const pixels = sc.getImageData(0, 0, sample.width, sample.height).data;
      const scale = artWidth / sample.width;
      const left = (width - artWidth) / 2 + artWidth * .023;
      const top = sceneY - source.height * .532 / source.width * artWidth;
      const clearance = clamp(width * .054, 40, 76);
      points = [];
      for (let y = 0; y < sample.height; y++) for (let x = 0; x < sample.width; x++) {
        const i = (y * sample.width + x) * 4;
        const luminance = (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255;
        if (luminance < .14) continue;
        const seed = ((x * 127 + y * 311) % 997) / 997;
        const side = x < sample.width * .477 ? 0 : 1;
        // Stretch the artwork's tonal range so knuckles, tendons and folds stay legible.
        const tone = Math.pow(clamp((luminance - .34) / .64), 1.6);
        points.push({ x: left + x * scale + (side ? clearance : -clearance), y: top + y * scale, alpha: .08 + tone * .73, glyph: CURRENCIES[Math.floor(seed * CURRENCIES.length)], side, seed });
      }
      // Rasterize once. Idle motion transforms two whole hands, preserving their anatomy.
      layers = [0, 1].map(side => {
        const layer = document.createElement('canvas');
        layer.width = Math.round((width + overscan * 2) * dpr); layer.height = Math.round((height + overscan * 2) * dpr);
        const c = layer.getContext('2d');
        if (c) {
          c.scale(dpr, dpr); c.translate(overscan, overscan); c.textAlign = 'center'; c.textBaseline = 'middle';
          c.font = (cell * 1.08) + 'px ' + SYMBOL_FONT;
          for (const p of points) if (p.side === side) { c.fillStyle = 'rgba(218,224,229,' + p.alpha + ')'; c.fillText(p.glyph, p.x, p.y); }
        }
        return layer;
      });
    };

    const handPose = (side: number) => {
      const phase = elapsed * .78 + side * .55;
      const amount = width < 640 ? .68 : 1;
      return {
        x: Math.sin(phase) * 10 * amount * (side ? -1 : 1),
        y: Math.sin(phase + .8) * 7 * amount,
        rotation: Math.sin(phase) * .023 * (side ? -1 : 1),
        pivot: side ? width : 0,
      };
    };
    const drawHands = (target: CanvasRenderingContext2D, alpha: number) => {
      for (const side of [0, 1]) {
        const pose = handPose(side);
        target.save(); target.globalAlpha = alpha;
        target.translate(pose.pivot + pose.x, sceneY + pose.y);
        target.rotate(pose.rotation); target.translate(-pose.pivot, -sceneY);
        if (layers[side]) target.drawImage(layers[side], -overscan, -overscan, width + overscan * 2, height + overscan * 2);
        target.restore();
      }
    };

    const render = (time: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (document.hidden || !intersecting) { last = time; return; }
      if (time - last < 1000 / 45) return;
      const delta = Math.min((time - last) / 1000, .055); last = time;
      const moving = options.current.animate;
      if (!moving || options.current.skipIntro) complete();
      if (moving) {
        elapsed += delta;
        if (!completed) intro += delta;
      }
      if (!loaded && intro > .7 && !completed) intro = .7;
      if (intro >= 3.15) complete();
      ctx.fillStyle = '#0b0e16'; ctx.fillRect(0, 0, width, height);
      const t = pointer.current;
      const baseRadius = clamp(width * .047, 34, 66);
      const hitCoin = t.active && Math.hypot(t.x - width / 2, t.y - sceneY) < baseRadius * 1.3;
      const follow = 1 - Math.exp(-delta * 9);
      if (t.active && smooth.strength < .01) { smooth.x = t.x; smooth.y = t.y; }
      smooth.x += (t.x - smooth.x) * follow; smooth.y += (t.y - smooth.y) * follow;
      smooth.strength += ((t.active ? 1 : 0) - smooth.strength) * follow;
      if (moving) smooth.hover += ((hitCoin ? 1 : 0) - smooth.hover) * follow;
      if (moving) coinAngle += delta * Math.PI * 2 / 6 * (1 + smooth.hover * .35);
      const morph = ease((intro - .7) / 1.9);
      const settled = ease((intro - 2.1) / .7);

      if (!completed && morph < 1) {
        const giantAlpha = 1 - ease((intro - .65) / .55);
        for (const [index, a] of anchors.entries()) {
          ctx.save(); ctx.translate(a.x + Math.sin(intro * 1.5 + index) * 9, a.y + Math.sin(intro * 1.8 + index) * 12);
          ctx.rotate(a.rotation + Math.sin(intro + index) * .04);
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.font = '500 ' + a.size + 'px ' + SYMBOL_FONT;
          ctx.fillStyle = 'rgba(225,194,133,' + giantAlpha * (index % 2 ? .7 : .95) + ')';
          ctx.fillText(a.glyph, 0, 0); ctx.restore();
        }
        const particleAlpha = ease((intro - .66) / .38) * (1 - settled);
        ctx.font = (cell * 1.08) + 'px ' + SYMBOL_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const [index, p] of points.entries()) {
          const start = cloud[(index * 73) % cloud.length] || { x: width / 2, y: height / 2 };
          const bend = Math.sin(morph * Math.PI) * 35;
          const x = start.x + (p.x - start.x) * morph + Math.sin(p.seed * 12) * bend;
          const y = start.y + (p.y - start.y) * morph + Math.cos(p.seed * 12) * bend;
          ctx.fillStyle = 'rgba(220,212,191,' + particleAlpha * Math.max(.2, p.alpha) + ')';
          ctx.fillText(p.glyph, x, y);
        }
      }
      drawHands(ctx, completed ? 1 : settled);

      if (lightCtx && smooth.strength > .005 && completed) {
        lightCtx.setTransform(dpr, 0, 0, dpr, 0, 0); lightCtx.clearRect(0, 0, width, height);
        lightCtx.globalCompositeOperation = 'source-over'; drawHands(lightCtx, 1);
        lightCtx.globalCompositeOperation = 'destination-in';
        const r = Math.min(width * .22, 190);
        const gradient = lightCtx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, r);
        gradient.addColorStop(0, 'rgba(255,255,255,' + smooth.strength + ')'); gradient.addColorStop(1, 'transparent');
        lightCtx.fillStyle = gradient; lightCtx.fillRect(0, 0, width, height);
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .72;
        ctx.drawImage(illuminated, 0, 0, width, height); ctx.restore();
      }
      const coinOpacity = completed ? 1 : ease((intro - 2) / .85);
      if (coinOpacity > 0) {
        const cos = Math.cos(coinAngle), sin = Math.sin(coinAngle);
        const hover = smooth.hover;
        const coinRadius = baseRadius * (1 + hover * .09) * (.88 + coinOpacity * .12);
        const coinY = sceneY - hover * 5, tilt = -.1 + hover * .14;
        if (smooth.hover > .01) {
          const glow = ctx.createRadialGradient(width / 2, coinY, 1, width / 2, coinY, coinRadius * 1.8);
          glow.addColorStop(0, 'rgba(229,192,118,' + smooth.hover * .1 + ')'); glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow; ctx.fillRect(width / 2 - coinRadius * 2, coinY - coinRadius * 2, coinRadius * 4, coinRadius * 4);
        }
        const projected = coin.map(p => ({ ...p, rx: p.x * cos + p.z * sin, depth: -p.x * sin + p.z * cos, normalX: p.nx * cos + p.nz * sin, normalZ: -p.nx * sin + p.nz * cos }))
          .filter(p => p.normalZ > -.08).sort((a, b) => a.depth - b.depth);
        ctx.font = Math.max(2.6, coinRadius * .054) + 'px ' + SYMBOL_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const p of projected) {
          const perspective = 1 + p.depth * .075;
          const x = (p.rx * Math.cos(tilt) - p.y * Math.sin(tilt)) * coinRadius * perspective;
          const y = (p.rx * Math.sin(tilt) + p.y * Math.cos(tilt)) * coinRadius * perspective;
          const light = Math.max(0, -.45 * p.normalX + .8 * p.normalZ);
          const alpha = coinOpacity * clamp(.35 + light * .5 + (p.rim ? .15 : 0) + smooth.hover * .1);
          ctx.fillStyle = p.engraving ? 'rgba(255,237,194,' + alpha + ')' : 'rgba(205,163,90,' + alpha * .55 + ')';
          ctx.fillText(CURRENCIES[Math.abs(Math.round(p.x * 71 + p.y * 113)) % CURRENCIES.length], width / 2 + x, coinY + y);
        }
      }
    };
    source.onload = () => { if (!disposed) { loaded = true; resize(); } };
    source.onerror = complete; source.src = '/hands.png';
    logo.onload = () => {
      if (disposed) return;
      const mask = document.createElement('canvas'); mask.width = 128; mask.height = 128;
      const c = mask.getContext('2d'); if (!c) return;
      c.drawImage(logo, 0, 0, 128, 128); coin = makeCoin(c.getImageData(0, 0, 128, 128).data);
    };
    logo.src = '/pp-logo.svg';
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; }); intersection.observe(canvas);
    resize(); frame = requestAnimationFrame(render);
    return () => { disposed = true; cancelAnimationFrame(frame); clearTimeout(failSafe); observer.disconnect(); intersection.disconnect(); source.onload = null; logo.onload = null; source.onerror = null; };
  }, []);

  return <canvas ref={canvasRef} className="hand-canvas" tabIndex={0} role="img"
    aria-label="Two hands made of currency symbols reach toward a rotating Pretty Penny coin. Move your pointer, touch, or use the arrow keys to explore."
    onPointerMove={e => { const box = e.currentTarget.getBoundingClientRect(); pointer.current = { x: e.clientX - box.left, y: e.clientY - box.top, active: true }; }}
    onPointerDown={e => { const box = e.currentTarget.getBoundingClientRect(); pointer.current = { x: e.clientX - box.left, y: e.clientY - box.top, active: true }; }}
    onPointerLeave={() => { pointer.current.active = false; }}
    onPointerCancel={() => { pointer.current.active = false; }}
    onBlur={() => { pointer.current.active = false; }}
    onKeyDown={e => {
      if (e.key === 'Escape') { pointer.current.active = false; return; }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault(); const box = e.currentTarget.getBoundingClientRect();
      if (!pointer.current.active) pointer.current = { x: box.width / 2, y: box.height * .73, active: true };
      pointer.current.x = clamp(pointer.current.x + (e.key === 'ArrowRight' ? 30 : e.key === 'ArrowLeft' ? -30 : 0), 0, box.width);
      pointer.current.y = clamp(pointer.current.y + (e.key === 'ArrowDown' ? 30 : e.key === 'ArrowUp' ? -30 : 0), 0, box.height);
    }} />;
}
