'use client';

import { useEffect, useRef } from 'react';

const CURRENCIES = ['$', '€', '£', '¥', '₺', '₹'];
const SYMBOL_FONT = 'Consolas, "Segoe UI Symbol", monospace';
const INK = '#090b0d';
const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const out = (n: number) => 1 - Math.pow(1 - clamp(n), 4);
const seeded = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

type Props = { animate: boolean; skipIntro: boolean; onIntroComplete: () => void };
type Particle = { x: number; y: number; group: number; seed: number; tx: number; ty: number };
type Anchor = { x: number; y: number; size: number; rotation: number };
type HandLayer = { image: HTMLCanvasElement; side: number };
type CoinPose = { x: number; y: number; radius: number; angle: number };

export default function HeroArt({ animate, skipIntro, onIntroComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const options = useRef({ animate, skipIntro, onIntroComplete });
  const pointer = useRef({ x: -1000, y: -1000, active: false, keyboard: false });
  useEffect(() => { options.current = { animate, skipIntro, onIntroComplete }; }, [animate, skipIntro, onIntroComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) { options.current.onIntroComplete(); return; }

    const source = new Image(), logo = new Image();
    let width = 0, height = 0, dpr = 1, sceneY = 0, baseRadius = 0;
    let frame = 0, last = 0, elapsed = 0, intro = 0, angle = -.3;
    let loaded = false, fontsReady = false, disposed = false, announced = false, visible = true;
    let hover = 0, lightX = 0, lightY = 0, lightStrength = 0;
    let anchors: Anchor[] = [], particles: Particle[] = [], hands: HandLayer[] = [];
    const overscan = 160;
    const face = document.createElement('canvas');
    const edge = document.createElement('canvas');
    const sprite = document.createElement('canvas');
    const spotlight = document.createElement('canvas');
    const lightCtx = spotlight.getContext('2d');
    let faceReady = false;

    const finish = () => {
      if (!announced) { announced = true; options.current.onIntroComplete(); }
    };
    // Asset failures, background tabs and slow connections cannot lock access to the page.
    const fallback = window.setTimeout(() => { intro = 5; finish(); }, 6500);

    const buildCoin = () => {
      face.width = face.height = 640;
      const c = face.getContext('2d');
      if (!c) return;
      const r = 300, cx = 320, cy = 320;
      c.clearRect(0, 0, 640, 640);
      const metal = c.createLinearGradient(70, 0, 560, 640);
      metal.addColorStop(0, '#f7ddb0'); metal.addColorStop(.25, '#be884d');
      metal.addColorStop(.47, '#edc589'); metal.addColorStop(.72, '#9a6639'); metal.addColorStop(1, '#dca66b');
      c.fillStyle = metal; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
      for (const [radius, alpha, thickness] of [[299, .9, 3], [284, .65, 2], [270, .55, 2], [239, .35, 1]]) {
        c.strokeStyle = 'rgba(255,231,191,' + alpha + ')'; c.lineWidth = thickness;
        c.beginPath(); c.arc(cx, cy, radius, 0, Math.PI * 2); c.stroke();
      }
      // Fine currency engraving is retained on the minted surface.
      c.font = '10px ' + SYMBOL_FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let y = -260; y <= 260; y += 12) for (let x = -260; x <= 260; x += 9) {
        if (Math.hypot(x, y) > 260) continue;
        c.fillStyle = 'rgba(53,32,17,' + (.11 + seeded(x + y * 71) * .15) + ')';
        c.fillText(CURRENCIES[Math.floor(seeded(x * 9 + y) * 6)], cx + x, cy + y);
      }
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 70) {
        c.strokeStyle = 'rgba(72,39,15,.58)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(cx + Math.cos(a) * 288, cy + Math.sin(a) * 288);
        c.lineTo(cx + Math.cos(a) * 297, cy + Math.sin(a) * 297); c.stroke();
      }
      if (logo.complete && logo.naturalWidth) {
        const stamp = document.createElement('canvas'); stamp.width = stamp.height = 300;
        const s = stamp.getContext('2d');
        if (s) {
          s.drawImage(logo, 35, 24, 230, 250);
          s.globalCompositeOperation = 'source-in'; s.fillStyle = '#62411e'; s.fillRect(0, 0, 300, 300);
          c.globalAlpha = .85; c.drawImage(stamp, 170, 167);
          s.fillStyle = '#fce4ba'; s.fillRect(0, 0, 300, 300);
          c.globalAlpha = .8; c.drawImage(stamp, 168, 164); c.globalAlpha = 1;
        }
      }
      c.font = '15px ' + SYMBOL_FONT; c.fillStyle = 'rgba(66,39,18,.85)';
      const inscription = 'PRETTY PENNY • INTELLIGENCE • ';
      for (let i = 0; i < inscription.length; i++) {
        const a = -Math.PI / 2 + i / inscription.length * Math.PI * 2;
        c.save(); c.translate(cx + Math.cos(a) * 252, cy + Math.sin(a) * 252); c.rotate(a + Math.PI / 2);
        c.fillText(inscription[i], 0, 0); c.restore();
      }
      edge.width = 72; edge.height = 640;
      const e = edge.getContext('2d');
      if (e) {
        const g = e.createLinearGradient(0, 0, 0, 640);
        g.addColorStop(0, '#eac38a'); g.addColorStop(.2, '#a3703f'); g.addColorStop(.5, '#f6d69e'); g.addColorStop(.8, '#80542e'); g.addColorStop(1, '#d8aa72');
        e.fillStyle = g; e.fillRect(0, 0, 72, 640);
        e.fillStyle = '#35231165'; for (let y = 0; y < 640; y += 9) e.fillRect(0, y, 72, 2);
      }
      faceReady = true;
    };

    const buildSprites = () => {
      sprite.width = 16 * 6; sprite.height = 16;
      const c = sprite.getContext('2d'); if (!c) return;
      c.font = '13px ' + SYMBOL_FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e9c48e';
      CURRENCIES.forEach((symbol, i) => c.fillText(symbol, i * 16 + 8, 8));
    };

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      width = box.width; height = box.height;
      if (!width || !height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spotlight.width = canvas.width; spotlight.height = canvas.height;
      const hero = canvas.closest('main');
      const titleBottom = hero?.querySelector('.hero-title')?.getBoundingClientRect().bottom;
      const contentTop = hero?.querySelector('.hero-bottom')?.getBoundingClientRect().top;
      const stageTop = titleBottom ? titleBottom - box.top : height * .39;
      const stageBottom = contentTop ? contentTop - box.top : height * .74;
      sceneY = mix(stageTop, stageBottom, .49);
      baseRadius = clamp(width * .056, 40, 82);
      const big = clamp(width * .195, 100, 265);
      anchors = CURRENCIES.map((_, i) => {
        const a = i / 6 * Math.PI * 2 - Math.PI * .68;
        return { x: width / 2 + Math.cos(a) * width * .31, y: height * .41 + Math.sin(a) * Math.min(height * .21, 210), size: big * (i % 2 ? .84 : 1), rotation: Math.cos(a) * .18 };
      });
      particles = [];
      for (const [group, anchor] of anchors.entries()) {
        const sample = document.createElement('canvas');
        sample.width = sample.height = 220;
        const c = sample.getContext('2d', { willReadFrequently: true });
        if (!c) continue;
        c.font = '180px "Instrument Serif", Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
        c.fillText(CURRENCIES[group], 110, 110);
        const data = c.getImageData(0, 0, 220, 220).data;
        for (let y = 0; y < 220; y += 3) for (let x = 0; x < 220; x += 3) {
          if (data[(y * 220 + x) * 4 + 3] < 100) continue;
          const seed = seeded(x + y * 131 + group * 1709);
          const a = seed * Math.PI * 2;
          const radius = Math.sqrt(seeded(x * 3 + y * 37 + group * 271));
          particles.push({ x: (x - 110) / 180 * anchor.size, y: (y - 110) / 180 * anchor.size, group, seed, tx: Math.cos(a) * radius, ty: Math.sin(a) * radius });
        }
      }
      if (!loaded) return;
      const artWidth = width < 760 ? width * 1.65 : Math.min(width * 1.13, (stageBottom - stageTop) * 4.5);
      const cellX = Math.max(2.5, artWidth / 470), cellY = cellX * 1.44;
      const sample = document.createElement('canvas');
      sample.width = Math.round(artWidth / cellX);
      sample.height = Math.round(artWidth * source.height / source.width / cellY);
      const c = sample.getContext('2d', { willReadFrequently: true });
      if (!c) return;
      c.drawImage(source, 0, 0, sample.width, sample.height);
      const pixels = c.getImageData(0, 0, sample.width, sample.height).data;
      const left = (width - artWidth) / 2 + artWidth * .023;
      const top = sceneY - artWidth * source.height / source.width * .532;
      const clearance = baseRadius * 1.23;
      hands = [0, 1].map(side => {
        const layer = document.createElement('canvas');
        layer.width = Math.round((width + overscan * 2) * dpr);
        layer.height = Math.round((height + overscan * 2) * dpr);
        const l = layer.getContext('2d');
        if (l) {
          l.scale(dpr, dpr); l.translate(overscan, overscan);
          l.font = (cellY * 1.1) + 'px ' + SYMBOL_FONT; l.textAlign = 'center'; l.textBaseline = 'middle';
          for (let y = 0; y < sample.height; y++) for (let x = 0; x < sample.width; x++) {
            const handSide = x < sample.width * .477 ? 0 : 1;
            if (handSide !== side) continue;
            const i = (y * sample.width + x) * 4;
            const lum = (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255;
            if (lum < .14) continue;
            const tone = Math.pow(clamp((lum - .35) / .65), 1.55);
            const px = left + x * cellX + (side ? clearance : -clearance), py = top + y * cellY;
            // Low continuous ink preserves the hand silhouette; currency engraving provides its texture.
            l.fillStyle = 'rgba(224,223,213,' + tone * .12 + ')'; l.fillRect(px - cellX / 2, py - cellY / 2, cellX, cellY);
            l.fillStyle = 'rgba(229,231,226,' + (.08 + tone * .77) + ')';
            l.fillText(CURRENCIES[Math.floor(seeded(x + y * 73) * 6)], px, py);
          }
        }
        return { image: layer, side };
      });
    };

    const drawHands = (target: CanvasRenderingContext2D, reveal: number) => {
      for (const { image, side } of hands) {
        const phase = elapsed * .62 + side * .7;
        const pivot = side ? width : 0;
        const enter = 1 - out(reveal);
        const dx = (Math.sin(phase) * 8 + enter * 100) * (side ? 1 : -1);
        const dy = Math.sin(phase + .65) * 6 + enter * 24;
        const rotation = (Math.sin(phase) * .025 + enter * .055) * (side ? -1 : 1);
        target.save(); target.globalAlpha = smoothstep(reveal);
        target.translate(pivot + dx, sceneY + dy); target.rotate(rotation); target.translate(-pivot, -sceneY);
        target.drawImage(image, -overscan, -overscan, width + overscan * 2, height + overscan * 2);
        target.restore();
      }
    };

    const drawCoin = (pose: CoinPose, alpha: number) => {
      if (!faceReady || alpha <= 0) return;
      const cos = Math.cos(pose.angle), sin = Math.sin(pose.angle), squash = Math.max(.014, Math.abs(cos));
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(pose.x, pose.y);
      ctx.rotate(-.12 + hover * .12);
      const thick = pose.radius * .19 * sin;
      // Extrusion and reeding stay visible as the same coin turns edge-on.
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.abs(thick) + pose.radius * squash, pose.radius, 0, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(edge, -Math.abs(thick) - pose.radius * squash, -pose.radius, (Math.abs(thick) + pose.radius * squash) * 2, pose.radius * 2);
      ctx.restore();
      ctx.translate(thick, 0); ctx.scale(squash, 1);
      ctx.drawImage(face, -pose.radius * 1.067, -pose.radius * 1.067, pose.radius * 2.134, pose.radius * 2.134);
      const shade = ctx.createLinearGradient(-pose.radius, 0, pose.radius, 0);
      shade.addColorStop(0, 'rgba(255,246,220,' + (.07 + Math.max(0, sin) * .2) + ')');
      shade.addColorStop(.5, 'rgba(255,240,213,.02)');
      shade.addColorStop(1, 'rgba(19,11,4,' + Math.abs(sin) * .38 + ')');
      ctx.fillStyle = shade; ctx.beginPath(); ctx.arc(0, 0, pose.radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const render = (time: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (document.hidden || !visible) { last = time; return; }
      if (time - last < 1000 / 60) return;
      const delta = Math.min((time - last) / 1000, .04); last = time;
      const moving = options.current.animate;
      if (!moving || options.current.skipIntro) { intro = 5; finish(); }
      if (moving) {
        elapsed += delta;
        if (loaded && fontsReady) intro += delta;
        angle += delta * Math.PI * 2 / 8 * (1 + hover * .42);
      }
      if (intro >= 3.45) finish();
      ctx.fillStyle = INK; ctx.fillRect(0, 0, width, height);

      const converge = smoothstep((intro - 1) / 1.6);
      const transfer = smoothstep((intro - 2.5) / 1.15);
      const revealHands = clamp((intro - 2.65) / 1.3);
      const coinAlpha = smoothstep((intro - 2) / .65);
      const introRadius = baseRadius * (width < 760 ? 1.85 : 2);
      const coinY = mix(height * .41, sceneY, transfer);
      const coinRadius = mix(introRadius, baseRadius, transfer);
      const t = pointer.current;
      const hit = t.active && intro > 3.45 && Math.hypot(t.x - width / 2, t.y - sceneY) < baseRadius * 1.5;
      const follow = t.keyboard ? 1 : 1 - Math.exp(-delta * 8);
      if (moving) hover += ((hit ? 1 : 0) - hover) * follow;
      if (lightStrength < .01 && t.active) { lightX = t.x; lightY = t.y; }
      lightX += (t.x - lightX) * follow; lightY += (t.y - lightY) * follow;
      lightStrength += ((t.active ? 1 : 0) - lightStrength) * follow;

      if (intro < 2.8) {
        const solidAlpha = out(intro / .32) * (1 - smoothstep((intro - .8) / .5));
        for (const [i, a] of anchors.entries()) {
          const orbit = Math.min(intro, 1.15);
          const x = a.x + Math.sin(orbit * 1.2 + i) * 16;
          const y = a.y + Math.cos(orbit * 1.3 + i) * 16;
          ctx.save(); ctx.translate(x, y); ctx.rotate(a.rotation + Math.sin(orbit + i) * .07);
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.font = a.size + 'px "Instrument Serif", Georgia, serif';
          ctx.fillStyle = i % 2 ? 'rgba(240,228,207,' + solidAlpha * .84 + ')' : 'rgba(216,177,123,' + solidAlpha + ')';
          ctx.fillText(CURRENCIES[i], 0, 0); ctx.restore();
        }
        const cloudAlpha = smoothstep((intro - .8) / .4) * (1 - smoothstep((intro - 2.25) / .55));
        if (cloudAlpha > .001) {
          for (const p of particles) {
            const a = anchors[p.group];
            const gather = smoothstep((intro - .95 - p.seed * .15) / 1.5);
            const phase = Math.min(intro, 1.15);
            const rot = a.rotation + Math.sin(phase + p.group) * .07;
            const sx = a.x + Math.sin(phase * 1.2 + p.group) * 16 + p.x * Math.cos(rot) - p.y * Math.sin(rot);
            const sy = a.y + Math.cos(phase * 1.3 + p.group) * 16 + p.x * Math.sin(rot) + p.y * Math.cos(rot);
            const twist = (1 - gather) * .9;
            const tx = width / 2 + (p.tx * Math.cos(twist) - p.ty * Math.sin(twist)) * introRadius;
            const ty = height * .41 + (p.tx * Math.sin(twist) + p.ty * Math.cos(twist)) * introRadius;
            const bend = Math.sin(gather * Math.PI) * (p.group % 2 ? 1 : -1);
            const px = mix(sx, tx, gather) + bend * (sy - ty) * .25;
            const py = mix(sy, ty, gather) - bend * (sx - tx) * .2;
            const size = mix(4, 3, converge);
            ctx.globalAlpha = cloudAlpha * (.55 + p.seed * .45);
            ctx.drawImage(sprite, p.group * 16, 0, 16, 16, px - size / 2, py - size / 2, size, size);
          }
          ctx.globalAlpha = 1;
        }
      }

      if (revealHands > 0) drawHands(ctx, revealHands);
      if (lightCtx && lightStrength > .01 && intro > 3.45) {
        lightCtx.setTransform(dpr, 0, 0, dpr, 0, 0); lightCtx.clearRect(0, 0, width, height);
        lightCtx.globalCompositeOperation = 'source-over'; drawHands(lightCtx, revealHands);
        lightCtx.globalCompositeOperation = 'destination-in';
        const r = Math.min(width * .25, 230);
        const g = lightCtx.createRadialGradient(lightX, lightY, 0, lightX, lightY, r);
        g.addColorStop(0, 'rgba(255,255,255,' + lightStrength * .6 + ')'); g.addColorStop(1, 'transparent');
        lightCtx.fillStyle = g; lightCtx.fillRect(0, 0, width, height);
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(spotlight, 0, 0, width, height); ctx.restore();
      }
      // A quiet halo is local to the focal object, never a full-page decorative wash.
      if (coinAlpha > 0) {
        const glowRadius = coinRadius * (2 + hover * .4);
        const glow = ctx.createRadialGradient(width / 2, coinY, 0, width / 2, coinY, glowRadius);
        glow.addColorStop(0, 'rgba(193,136,64,' + coinAlpha * (.085 + hover * .06) + ')'); glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow; ctx.fillRect(width / 2 - glowRadius, coinY - glowRadius, glowRadius * 2, glowRadius * 2);
        drawCoin({ x: width / 2, y: coinY - hover * 8 + Math.sin(elapsed * .85) * 3 * transfer, radius: coinRadius * (1 + hover * .08), angle: mix(-.3, angle, smoothstep((intro - 2.15) / 1)) }, coinAlpha);
      }
    };

    source.onload = () => { if (!disposed) { loaded = true; resize(); } };
    source.onerror = () => { intro = 5; finish(); };
    source.src = '/hands.png';
    logo.onload = () => { if (!disposed) buildCoin(); };
    logo.src = '/pp-logo.svg';
    buildSprites(); buildCoin();
    document.fonts.ready.then(() => { if (!disposed) { fontsReady = true; resize(); } });
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); intersection.observe(canvas);
    resize(); frame = requestAnimationFrame(render);
    return () => {
      disposed = true; cancelAnimationFrame(frame); clearTimeout(fallback);
      observer.disconnect(); intersection.disconnect(); source.onload = null; source.onerror = null; logo.onload = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="hand-canvas" tabIndex={0} role="img"
    aria-label="Currency symbols gather into a Pretty Penny coin, held between two gently moving hands made from currency symbols. Move the pointer, touch, or use arrow keys to explore."
    onPointerMove={e => { const box = e.currentTarget.getBoundingClientRect(); pointer.current = { x: e.clientX - box.left, y: e.clientY - box.top, active: true, keyboard: false }; }}
    onPointerDown={e => { const box = e.currentTarget.getBoundingClientRect(); pointer.current = { x: e.clientX - box.left, y: e.clientY - box.top, active: true, keyboard: false }; }}
    onPointerLeave={() => { pointer.current.active = false; }}
    onPointerCancel={() => { pointer.current.active = false; }}
    onBlur={() => { pointer.current.active = false; }}
    onKeyDown={e => {
      if (e.key === 'Escape') { pointer.current.active = false; return; }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault(); const box = e.currentTarget.getBoundingClientRect();
      if (!pointer.current.active) pointer.current = { x: box.width / 2, y: box.height * .55, active: true, keyboard: true };
      pointer.current.keyboard = true;
      pointer.current.x = clamp(pointer.current.x + (e.key === 'ArrowRight' ? 30 : e.key === 'ArrowLeft' ? -30 : 0), 0, box.width);
      pointer.current.y = clamp(pointer.current.y + (e.key === 'ArrowDown' ? 30 : e.key === 'ArrowUp' ? -30 : 0), 0, box.height);
    }} />;
}
