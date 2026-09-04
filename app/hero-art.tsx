'use client';

import { useEffect, useRef } from 'react';
import { createHandEffects } from './hand-effects';
import { HAND_DIRECTIONS, materialTone } from './hand-motion';
import type { HandSource, IntroDefinition, IntroEnvironment } from './intro/types';
import { CAMERA_DISTANCE, COIN_HALF_DEPTH, projectCoin, rotateCoin, triangleTransform, visibleFace, type Point2 } from './coin-geometry';
import { spinAngle } from './intro/motion';

const CURRENCIES = ['$', '€', '£', '¥', '₺', '₹'];
const SYMBOL_FONT = 'Consolas, "Segoe UI Symbol", monospace';
const INK = '#090b0d';
const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const out = (n: number) => 1 - Math.pow(1 - clamp(n), 4);
const seeded = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

type Props = { animate: boolean; skipIntro: boolean; onIntroComplete: () => void; definition?: IntroDefinition };
type Particle = { x: number; y: number; group: number; seed: number; tx: number; ty: number };
type Anchor = { x: number; y: number; size: number; rotation: number };
type HandGlyph = { x: number; y: number; symbol: number; tone: number; seed: number; offsetX: number; offsetY: number; vx: number; vy: number; energy: number };
type HandLayer = { image: HTMLCanvasElement; glyphs: HTMLCanvasElement; points: HandGlyph[]; side: number; x: number; y: number; width: number; height: number };
type CoinSurface = { points: Point2[]; depth: number; texture?: HTMLCanvasElement; uv?: Point2[]; fill?: string; shade?: number };
type CoinPose = { x: number; y: number; radius: number; angle: number };

export default function HeroArt({ animate, skipIntro, onIntroComplete, definition }: Props) {
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
    const experiment = definition?.create();
    const handEffects = definition ? createHandEffects(definition.id) : null;
    const endTime = definition?.duration ?? 3.95;
    let introSources: HandSource[][] = [[], []];
    let width = 0, height = 0, dpr = 1, sceneY = 0, baseRadius = 0, introY = 0, introMaxRadius = 180;
    let frame = 0, last = 0, elapsed = 0, intro = 0;
    let loaded = false, fontsReady = false, disposed = false, announced = false, visible = true, staticRendered = false;
    let hover = 0, lightX = 0, lightY = 0, lightStrength = 0;
    let anchors: Anchor[] = [], particles: Particle[] = [], hands: HandLayer[] = [];
    const face = document.createElement('canvas');
    const reverse = document.createElement('canvas');
    const blankFace = document.createElement('canvas');
    const mintedFace = document.createElement('canvas');
    blankFace.width = blankFace.height = mintedFace.width = mintedFace.height = 640;
    let lastMint = -1;
    const sprite = document.createElement('canvas');
    const spotlight = document.createElement('canvas');
    const lightCtx = spotlight.getContext('2d');
    const handScene = document.createElement('canvas');
    const handCtx = handScene.getContext('2d');
    const handReflection = document.createElement('canvas');
    const reflectionCtx = handReflection.getContext('2d');
    let faceReady = false;

    const finish = () => {
      if (!announced) { announced = true; clearTimeout(fallback); options.current.onIntroComplete(); }
    };
    // Asset failures, background tabs and slow connections cannot lock access to the page.
    const fallback = window.setTimeout(() => { if (!announced) { intro = Math.max(intro, endTime + 1); finish(); } }, 8500);

    const buildCoin = () => {
      staticRendered = false;
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
      blankFace.getContext('2d')?.drawImage(face, 0, 0);
      lastMint = -1;
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
      // A distinct reverse gives an unmistakable front -> edge -> back -> edge cycle.
      reverse.width = reverse.height = 640;
      const back = reverse.getContext('2d');
      if (back) {
        back.drawImage(face, 0, 0);
        const satin = back.createLinearGradient(80, 100, 540, 540);
        satin.addColorStop(0, '#d9b781'); satin.addColorStop(.5, '#ae7f4c'); satin.addColorStop(1, '#ddba80');
        back.fillStyle = satin; back.beginPath(); back.arc(320, 320, 237, 0, Math.PI * 2); back.fill();
        back.textAlign = 'center'; back.textBaseline = 'middle';
        back.fillStyle = '#644321'; back.font = '51px Georgia, serif';
        back.fillText('PRETTY', 320, 283); back.fillText('PENNY', 320, 343);
        back.font = '17px ' + SYMBOL_FONT; back.fillText('INTELLIGENCE', 320, 397);
        back.fillStyle = 'rgba(255,234,197,.85)'; back.font = '51px Georgia, serif';
        back.fillText('PRETTY', 318, 281); back.fillText('PENNY', 318, 341);
        back.font = '19px ' + SYMBOL_FONT;
        CURRENCIES.forEach((symbol, i) => {
          const a = i / 6 * Math.PI * 2 - Math.PI / 2;
          back.fillText(symbol, 320 + Math.cos(a) * 196, 320 + Math.sin(a) * 196);
        });
      }
      faceReady = true;
    };

    const buildSprites = () => {
      sprite.width = 16 * 6; sprite.height = 32;
      const c = sprite.getContext('2d'); if (!c) return;
      c.font = '13px ' + SYMBOL_FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#e9c48e';
      CURRENCIES.forEach((symbol, i) => c.fillText(symbol, i * 16 + 8, 8));
      c.fillStyle = '#c6d5e2';
      CURRENCIES.forEach((symbol, i) => c.fillText(symbol, i * 16 + 8, 24));
    };

    const resize = () => {
      staticRendered = false;
      const box = canvas.getBoundingClientRect();
      width = box.width; height = box.height;
      if (!width || !height) return;
      const visibleHeight = Math.min(height, window.innerHeight - Math.max(0, box.top));
      introY = Math.min(height * .4, visibleHeight * .4);
      introMaxRadius = Math.max(48, visibleHeight - 252 - introY);
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const layer of [spotlight, handScene, handReflection]) { layer.width = canvas.width; layer.height = canvas.height; }
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
      const left = (width - artWidth) / 2 + artWidth * .023;
      const top = sceneY - artWidth * source.height / source.width * .532;
      const scale = artWidth / source.width;
      const clearance = baseRadius * 1.24;
      const original = document.createElement('canvas');
      original.width = source.width; original.height = source.height;
      const originalCtx = original.getContext('2d', { willReadFrequently: true });
      if (!originalCtx) return;
      originalCtx.drawImage(source, 0, 0);
      const pixels = originalCtx.getImageData(0, 0, source.width, source.height).data;
      const cropY = Math.floor(source.height * .325);
      const cropHeight = Math.ceil(source.height * .43);
      const split = Math.floor(source.width * .477);
      hands = [0, 1].map(side => {
        const cropX = side ? split : 0, cropWidth = side ? source.width - split : split;
        const sculpture = document.createElement('canvas');
        sculpture.width = cropWidth; sculpture.height = cropHeight;
        const s = sculpture.getContext('2d');
        if (s) {
          const material = s.createImageData(cropWidth, cropHeight);
          for (let y = 0; y < cropHeight; y++) for (let x = 0; x < cropWidth; x++) {
            const from = ((cropY + y) * source.width + cropX + x) * 4;
            const to = (y * cropWidth + x) * 4;
            const lum = (pixels[from] * .2126 + pixels[from + 1] * .7152 + pixels[from + 2] * .0722) / 255;
            const contour = definition ? smoothstep((lum - .016) / .075) : smoothstep((lum - .055) / .15);
            const tone = Math.pow(clamp((lum - .27) / .73), 1.5);
            const level = 47 + tone * 174;
            const color = definition ? materialTone(lum, definition.id) : [level * 1.025, level * 1.013, level * .984];
            material.data[to] = color[0];
            material.data[to + 1] = color[1];
            material.data[to + 2] = color[2];
            material.data[to + 3] = contour * 255;
          }
          s.putImageData(material, 0, 0);
        }
        const logicalWidth = cropWidth * scale, logicalHeight = cropHeight * scale;
        const glyphs = document.createElement('canvas');
        glyphs.width = Math.ceil(logicalWidth * dpr); glyphs.height = Math.ceil(logicalHeight * dpr);
        const g = glyphs.getContext('2d');
        const points: HandGlyph[] = [];
        const cellX = definition ? Math.max(4, artWidth / 345) : Math.max(3.4, artWidth / 390), cellY = cellX * 1.55;
        if (g) {
          g.scale(dpr, dpr); g.font = (cellY * 1.03) + 'px ' + SYMBOL_FONT;
          g.textAlign = 'center'; g.textBaseline = 'middle';
          for (let y = cellY / 2; y < logicalHeight; y += cellY) for (let x = cellX / 2; x < logicalWidth; x += cellX) {
            const px = cropX + Math.floor(x / scale), py = cropY + Math.floor(y / scale);
            const i = (py * source.width + px) * 4;
            const lum = (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255;
            if (lum < (definition ? .13 : .2)) continue;
            const seed = seeded(px + py * 73), tone = definition ? Math.pow(clamp((lum - .04) / .96), 1.1) : Math.pow(clamp((lum - .27) / .73), 1.5);
            const symbol = Math.floor(seed * 6);
            // An engraved texture, not a replacement for the continuous sculpture.
            const engraving = definition ? (.025 + tone * HAND_DIRECTIONS[definition.id].grain) : (.07 + tone * .2);
            g.fillStyle = 'rgba(' + (definition ? '24,26,28,' : '43,42,37,') + engraving + ')';
            g.fillText(CURRENCIES[symbol], x, y);
            points.push({ x, y, symbol, tone, seed, offsetX: 0, offsetY: 0, vx: 0, vy: 0, energy: 0 });
          }
        }
        return { image: sculpture, glyphs, points, side, x: left + cropX * scale + (side ? clearance : -clearance), y: top + cropY * scale, width: logicalWidth, height: logicalHeight };
      });
      introSources = hands.map(hand => hand.points.filter((p, i) => i % Math.max(1, Math.floor(hand.points.length / 130)) === 0 && p.tone > .15).map(p => ({ x: hand.x + p.x, y: hand.y + p.y, symbol: p.symbol, seed: p.seed, tone: p.tone })));
    };

    const introEnvironment = (reveal: number, offsetY = 0): IntroEnvironment => {
      const transform = (p: { x: number; y: number }, side: number) => {
        const pose = handPose(side, reveal), c = Math.cos(pose.rotation), s = Math.sin(pose.rotation);
        const x = p.x - pose.pivot, y = p.y - sceneY;
        return { x: pose.pivot + pose.dx + x * c - y * s, y: sceneY + pose.dy + x * s + y * c + offsetY };
      };
      return {
        width, height, sceneY: sceneY + offsetY, radius: baseRadius, introY, introMaxRadius, sprite,
        handSources: introSources.map((points, side) => points.map(p => ({ ...p, ...transform(p, side) }))) as [HandSource[], HandSource[]],
        fingertips: [0, 1].map(side => {
          const hand = hands[side];
          return transform({ x: hand ? hand.x + (side ? 0 : hand.width) : width / 2 + (side ? 1 : -1) * baseRadius * 1.4, y: sceneY - 4 }, side);
        }) as IntroEnvironment['fingertips'],
      };
    };

    const handPose = (side: number, reveal: number) => {
      const phase = elapsed * .57 + side * .72;
      const enter = 1 - out(reveal);
      const response = handEffects?.pose(side) ?? { dx: 0, dy: 0, rotation: 0 };
      return {
        pivot: side ? width : 0,
        dx: (Math.sin(phase) * 6 + enter * 100) * (side ? 1 : -1) + response.dx,
        dy: Math.sin(phase + .65) * 4 + enter * 24 + response.dy,
        rotation: (Math.sin(phase) * .016 + enter * .055) * (side ? -1 : 1) + response.rotation,
      };
    };

    const drawHands = (reveal: number, delta: number, moving: boolean, warmth = 1) => {
      if (!handCtx) return;
      handCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      handCtx.clearRect(0, 0, width, height);
      handCtx.globalCompositeOperation = 'source-over';
      for (const hand of hands) {
        const pose = handPose(hand.side, reveal);
        handCtx.save(); handCtx.globalAlpha = smoothstep(reveal);
        handCtx.translate(pose.pivot + pose.dx, sceneY + pose.dy);
        handCtx.rotate(pose.rotation); handCtx.translate(-pose.pivot, -sceneY);
        handCtx.drawImage(hand.image, hand.x, hand.y, hand.width, hand.height);
        handCtx.drawImage(hand.glyphs, hand.x, hand.y, hand.width, hand.height);
        handCtx.restore();
      }

      // The coin's warm light is clipped to the actual hand silhouette.
      if (reflectionCtx) {
        reflectionCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        reflectionCtx.clearRect(0, 0, width, height);
        reflectionCtx.globalCompositeOperation = 'source-over';
        reflectionCtx.drawImage(handScene, 0, 0, width, height);
        reflectionCtx.globalCompositeOperation = 'source-in';
        const glow = reflectionCtx.createRadialGradient(width / 2, sceneY, baseRadius * .5, width / 2, sceneY, baseRadius * 4.2);
        glow.addColorStop(0, 'rgba(226,172,93,.37)'); glow.addColorStop(.35, 'rgba(226,172,93,.17)'); glow.addColorStop(1, 'transparent');
        reflectionCtx.fillStyle = glow; reflectionCtx.fillRect(0, 0, width, height);
        handCtx.globalCompositeOperation = 'screen';
        handCtx.globalAlpha = warmth * (definition ? HAND_DIRECTIONS[definition.id].warmth * 1.5 : 1);
        handCtx.drawImage(handReflection, 0, 0, width, height);
        handCtx.globalAlpha = 1;
        handCtx.globalCompositeOperation = 'source-over';
      }

      if (handEffects) {
        handEffects.render({
          ctx, material: handScene, sprite, width, height, dpr, sceneY, coinRadius: baseRadius,
          hands, poses: hands.map(hand => handPose(hand.side, reveal)), time: elapsed, delta,
          pointer: pointer.current, interactive: intro >= endTime, moving, reveal,
        });
        return;
      }
      const active = pointer.current.active && moving && intro >= endTime;
      const field = clamp(width * .11, 72, 112);
      if (lightCtx && lightStrength > .01 && intro >= endTime) {
        lightCtx.setTransform(dpr, 0, 0, dpr, 0, 0); lightCtx.clearRect(0, 0, width, height);
        lightCtx.globalCompositeOperation = 'source-over'; lightCtx.drawImage(handScene, 0, 0, width, height);
        lightCtx.globalCompositeOperation = 'source-in';
        const light = lightCtx.createRadialGradient(lightX, lightY, 0, lightX, lightY, field * 1.5);
        light.addColorStop(0, 'rgba(239,220,188,' + lightStrength * .14 + ')'); light.addColorStop(1, 'transparent');
        lightCtx.fillStyle = light; lightCtx.fillRect(0, 0, width, height);
        handCtx.globalCompositeOperation = 'screen'; handCtx.drawImage(spotlight, 0, 0, width, height);
        handCtx.globalCompositeOperation = 'source-over';
      }

      // Lift only a local patch of the material. The surrounding anatomy never disappears.
      if (moving && intro >= endTime && lightStrength > .01) {
        handCtx.globalCompositeOperation = 'destination-out';
        const hole = handCtx.createRadialGradient(lightX, lightY, 0, lightX, lightY, field);
        hole.addColorStop(0, 'rgba(0,0,0,' + lightStrength * .68 + ')');
        hole.addColorStop(.35, 'rgba(0,0,0,' + lightStrength * .38 + ')'); hole.addColorStop(1, 'transparent');
        handCtx.fillStyle = hole; handCtx.fillRect(lightX - field, lightY - field, field * 2, field * 2);
        handCtx.globalCompositeOperation = 'source-over';
      }
      ctx.drawImage(handScene, 0, 0, width, height);

      for (const hand of hands) {
        const pose = handPose(hand.side, reveal), c = Math.cos(pose.rotation), s = Math.sin(pose.rotation);
        for (const p of hand.points) {
          const localX = hand.x + p.x - pose.pivot, localY = hand.y + p.y - sceneY;
          const x = pose.pivot + pose.dx + localX * c - localY * s;
          const y = sceneY + pose.dy + localX * s + localY * c;
          const dx = x - lightX, dy = y - lightY;
          const distance = Math.hypot(dx, dy);
          const weight = active ? Math.pow(clamp(1 - distance / field), 2) : 0;
          if (weight < .001 && p.energy < .002 && Math.abs(p.offsetX) + Math.abs(p.offsetY) < .05) continue;
          if (moving) {
            const influence = 1 - Math.exp(-delta * (weight > p.energy ? 12 : 7));
            p.energy += (weight - p.energy) * influence;
            // A short tangential arc and a soft return, not an unbounded vortex.
            const nx = dx / Math.max(8, distance), ny = dy / Math.max(8, distance);
            const targetX = (nx * 19 - ny * 12 + Math.sin(elapsed * 1.7 + p.seed * 6) * 3) * weight;
            const targetY = (ny * 19 + nx * 12 - 11) * weight;
            const steps = Math.max(1, Math.ceil(delta / .016));
            const dt = delta / steps;
            for (let i = 0; i < steps; i++) {
              p.vx += ((targetX - p.offsetX) * 125 - p.vx * 21) * dt;
              p.vy += ((targetY - p.offsetY) * 125 - p.vy * 21) * dt;
              p.offsetX += p.vx * dt; p.offsetY += p.vy * dt;
            }
          }
          const size = 5 + p.energy * 3;
          ctx.globalAlpha = clamp(p.energy * 1.65) * (.48 + p.tone * .52) * smoothstep(reveal);
          ctx.drawImage(sprite, p.symbol * 16, 0, 16, 16, x + p.offsetX - size / 2, y + p.offsetY - size / 2, size, size);
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawCoin = (pose: CoinPose, alpha: number, mint = 1) => {
      if (!faceReady || alpha <= 0) return;
      let frontTexture = face;
      if (mint < 1) {
      if (Math.abs(mint - lastMint) > .001 || lastMint < 0) {
          const m = mintedFace.getContext('2d');
          if (m) {
            m.clearRect(0, 0, 640, 640);
            // Material closes from the milled rim inward; the seal is struck last.
            const fill = smoothstep((mint - .12) / .56);
            m.save(); m.beginPath(); m.arc(320, 320, 301, 0, Math.PI * 2);
            m.arc(320, 320, Math.max(.001, 280 * (1 - fill)), 0, Math.PI * 2, true); m.clip('evenodd');
            m.drawImage(blankFace, 0, 0); m.restore();
            const seal = smoothstep((mint - .66) / .34);
            // The relief emerges across the face as a pressed seal, not a wipe.
            if (seal > 0) { m.save(); m.globalAlpha = seal; m.drawImage(face, 0, 0); m.restore(); }
          }
          lastMint = mint;
        }
        frontTexture = mintedFace;
      }
      const tilt = .17 + hover * .04;
      const center = { x: pose.x, y: pose.y };
      const surfaces: CoinSurface[] = [];
      const segments = 64;
      const project = (x: number, y: number, z: number) => {
        const rotated = rotateCoin({ x, y, z }, pose.angle, tilt);
        return { world: rotated, screen: projectCoin(rotated, pose.radius, center) };
      };
      for (let i = 0; i < segments; i++) {
        const a = i / segments * Math.PI * 2, b = (i + 1) / segments * Math.PI * 2, mid = (a + b) / 2;
        const normal = rotateCoin({ x: Math.cos(mid), y: Math.sin(mid), z: 0 }, pose.angle, tilt);
        if (normal.z * CAMERA_DISTANCE <= 1) continue;
        const vertices = [
          project(Math.cos(a), Math.sin(a), -COIN_HALF_DEPTH),
          project(Math.cos(b), Math.sin(b), -COIN_HALF_DEPTH),
          project(Math.cos(b), Math.sin(b), COIN_HALF_DEPTH),
          project(Math.cos(a), Math.sin(a), COIN_HALF_DEPTH),
        ];
        const lit = clamp(normal.x * -.45 + normal.y * -.5 + normal.z * .74);
        const reed = i % 2 ? .84 : 1;
        const r = Math.round((114 + lit * 112) * reed), g = Math.round((72 + lit * 107) * reed), blue = Math.round((35 + lit * 80) * reed);
        surfaces.push({ points: vertices.map(v => v.screen), depth: vertices.reduce((sum, v) => sum + v.world.z, 0) / 4, fill: 'rgb(' + r + ',' + g + ',' + blue + ')' });
      }
      for (const side of [1, -1]) {
        if (!visibleFace(side, pose.angle, tilt)) continue;
        const normal = rotateCoin({ x: 0, y: 0, z: side }, pose.angle, tilt);
        const light = clamp(normal.x * -.4 + normal.y * -.45 + normal.z * .8);
        const centerVertex = project(0, 0, side * COIN_HALF_DEPTH);
        for (let i = 0; i < segments; i++) {
          const a = i / segments * Math.PI * 2, b = (i + 1) / segments * Math.PI * 2;
          const vertices = [centerVertex, project(Math.cos(a) * side, Math.sin(a), side * COIN_HALF_DEPTH), project(Math.cos(b) * side, Math.sin(b), side * COIN_HALF_DEPTH)];
          surfaces.push({
            points: vertices.map(v => v.screen),
            depth: vertices.reduce((sum, v) => sum + v.world.z, 0) / 3,
            texture: mint < 1 ? frontTexture : side === 1 ? face : reverse,
            uv: [{ x: 320, y: 320 }, { x: 320 + Math.cos(a) * 300, y: 320 + Math.sin(a) * 300 }, { x: 320 + Math.cos(b) * 300, y: 320 + Math.sin(b) * 300 }],
            shade: (1 - light) * .3 * smoothstep((mint - .12) / .56),
          });
        }
      }
      surfaces.sort((a, b) => a.depth - b.depth);
      ctx.save(); ctx.globalAlpha = alpha;
      for (const surface of surfaces) {
        const points = surface.points;
        const mid = { x: points.reduce((n, p) => n + p.x, 0) / points.length, y: points.reduce((n, p) => n + p.y, 0) / points.length };
        const path = () => {
          ctx.beginPath();
          points.forEach((p, i) => {
            // A subpixel overlap removes antialiasing cracks between adjacent mesh triangles.
            const d = Math.hypot(p.x - mid.x, p.y - mid.y) || 1;
            const x = p.x + (p.x - mid.x) / d * .22, y = p.y + (p.y - mid.y) / d * .22;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
          ctx.closePath();
        };
        if (surface.texture && surface.uv) {
          const matrix = triangleTransform(surface.uv, points);
          if (!matrix) continue;
          ctx.save(); path(); ctx.clip(); ctx.transform(...matrix);
          ctx.drawImage(surface.texture, 0, 0); ctx.restore();
        } else {
          path(); ctx.fillStyle = surface.fill || '#b78a4d'; ctx.fill();
        }
      }
      // Light the whole projected face once. Per-triangle translucent shading
      // produces visible dark seams along an otherwise continuous surface.
      for (const side of [1, -1]) {
        if (!visibleFace(side, pose.angle, tilt)) continue;
        ctx.save(); ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const a = i / segments * Math.PI * 2;
          const p = project(Math.cos(a), Math.sin(a), side * COIN_HALF_DEPTH).screen;
          if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
        }
        ctx.closePath(); ctx.clip();
        const normal = rotateCoin({ x: 0, y: 0, z: side }, pose.angle, tilt);
        const light = clamp(normal.x * -.4 + normal.y * -.45 + normal.z * .8);
        // Only shade a formed face; a half-minted coin remains an open ring.
        ctx.globalAlpha = alpha * smoothstep((mint - .6) / .4);
        ctx.fillStyle = 'rgba(29,20,12,' + (1 - light) * .28 + ')';
        ctx.fillRect(pose.x - pose.radius * 1.3, pose.y - pose.radius * 1.3, pose.radius * 2.6, pose.radius * 2.6);
        const sweep = Math.sin(pose.angle) * pose.radius * .85;
        const reflection = ctx.createLinearGradient(pose.x - pose.radius + sweep, pose.y - pose.radius, pose.x + pose.radius + sweep, pose.y + pose.radius * .4);
        reflection.addColorStop(0, 'transparent'); reflection.addColorStop(.34, 'transparent');
        reflection.addColorStop(.46, 'rgba(255,240,207,.03)'); reflection.addColorStop(.53, 'rgba(255,240,207,' + (.29 + hover * .11) + ')');
        reflection.addColorStop(.6, 'rgba(255,240,207,.06)'); reflection.addColorStop(.77, 'transparent');
        ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = reflection;
        ctx.fillRect(pose.x - pose.radius * 1.3, pose.y - pose.radius * 1.3, pose.radius * 2.6, pose.radius * 2.6);
        ctx.restore();
      }
      ctx.restore();
    };

    const render = (time: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (document.hidden || !visible) { last = time; return; }
      const clockDelta = last ? Math.max(0, (time - last) / 1000) : 0;
      const delta = Math.min(clockDelta, .04); last = time;
      const moving = options.current.animate;
      if (!moving && staticRendered) return;
      staticRendered = !moving;
      if (!moving || options.current.skipIntro) { intro = Math.max(intro, endTime); finish(); }
      if (moving) {
        elapsed += clockDelta;
        if (loaded && fontsReady) intro += clockDelta;
      }
      if (intro >= (definition?.releaseAt ?? 3.45)) finish();
      ctx.fillStyle = INK; ctx.fillRect(0, 0, width, height);

      const env = experiment ? introEnvironment(1) : undefined;
      const shot = experiment && env ? experiment.frame(intro, env) : undefined;
      const converge = smoothstep((intro - 1) / 1.6);
      const transfer = shot?.transfer ?? smoothstep((intro - 2.5) / 1.15);
      const revealHands = shot?.hands ?? clamp((intro - 2.65) / 1.3);
      const coinAlpha = shot?.coinAlpha ?? smoothstep((intro - 2) / .65);
      const introRadius = baseRadius * (width < 760 ? 1.85 : 2);
      const coinY = shot?.coinY ?? mix(height * .41, sceneY, transfer);
      const coinRadius = shot?.coinRadius ?? mix(introRadius, baseRadius, transfer);
      const t = pointer.current;
      const hit = t.active && intro >= endTime && Math.hypot(t.x - width / 2, t.y - sceneY) < baseRadius * 1.5;
      const follow = t.keyboard ? 1 : 1 - Math.exp(-delta * 8);
      if (moving) hover += ((hit ? 1 : 0) - hover) * follow;
      if (lightStrength < .01 && t.active) { lightX = t.x; lightY = t.y; }
      lightX += (t.x - lightX) * follow; lightY += (t.y - lightY) * follow;
      lightStrength += ((t.active ? 1 : 0) - lightStrength) * follow;

      if (!experiment && intro < 2.8) {
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

      const handOffset = definition?.id === 'hands' ? coinY - sceneY : 0;
      if (revealHands > 0) { ctx.save(); ctx.translate(0, handOffset); drawHands(revealHands, delta, moving, shot?.handLight ?? 1); ctx.restore(); }
      if (experiment && shot && intro < endTime) experiment.draw(ctx, intro, introEnvironment(revealHands, handOffset), shot);
      // A quiet halo is local to the focal object, never a full-page decorative wash.
      if (coinAlpha > 0) {
        const glowRadius = coinRadius * (2 + hover * .4);
        const glow = ctx.createRadialGradient(width / 2, coinY, 0, width / 2, coinY, glowRadius);
        glow.addColorStop(0, 'rgba(193,136,64,' + coinAlpha * (.085 + hover * .06) + ')'); glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow; ctx.fillRect(width / 2 - glowRadius, coinY - glowRadius, glowRadius * 2, glowRadius * 2);
        const coinAngle = !moving && elapsed === 0 ? -.22 : shot?.angle ?? spinAngle(intro, 2.5);
        drawCoin({ x: width / 2, y: coinY - hover * 5 + Math.sin(elapsed * .85) * 2.5 * transfer, radius: coinRadius * (1 + hover * .055), angle: coinAngle }, coinAlpha, shot?.mint ?? 1);
      }
    };

    source.onload = () => { if (!disposed) { loaded = true; resize(); } };
    let fallbackHands = false;
    source.onerror = () => {
      if (definition && !fallbackHands) { fallbackHands = true; source.src = '/hands.png'; return; }
      intro = endTime + 1; finish();
    };
    source.src = definition ? '/hands-sculpture-v2.png' : '/hands.png';
    logo.onload = () => { if (!disposed) buildCoin(); };
    logo.src = '/pp-logo.svg';
    buildSprites(); buildCoin();
    document.fonts.ready.then(() => { if (!disposed) { fontsReady = true; resize(); } });
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); intersection.observe(canvas);
    const resetClock = () => { last = 0; };
    document.addEventListener('visibilitychange', resetClock);
    resize(); frame = requestAnimationFrame(render);
    return () => {
      disposed = true; cancelAnimationFrame(frame); clearTimeout(fallback); handEffects?.clear();
      observer.disconnect(); intersection.disconnect(); source.onload = null; source.onerror = null; logo.onload = null;
      document.removeEventListener('visibilitychange', resetClock);
    };
  }, [definition]);

  return <canvas ref={canvasRef} className="hand-canvas" tabIndex={0} role="img"
    aria-label={definition ? HAND_DIRECTIONS[definition.id].name + '. A rotating coin between two responsive sculptural hands. Explore the hand surface with your pointer, drag with one finger, or use the arrow keys. Escape releases the interaction.' : 'A rotating Pretty Penny coin floats between two sculptural hands. Explore a hand with your pointer or touch to lift currency symbols. Arrow keys move the light; Escape releases it.'}
    onPointerMove={e => { if (!e.isPrimary) return; const box = e.currentTarget.getBoundingClientRect(); pointer.current = { x: e.clientX - box.left, y: e.clientY - box.top, active: true, keyboard: false }; }}
    onPointerDown={e => { if (!e.isPrimary) return; const box = e.currentTarget.getBoundingClientRect(); pointer.current = { x: e.clientX - box.left, y: e.clientY - box.top, active: true, keyboard: false }; }}
    onPointerUp={e => { if (e.isPrimary && e.pointerType !== 'mouse') pointer.current.active = false; }}
    onPointerLeave={() => { pointer.current.active = false; }}
    onPointerCancel={() => { pointer.current.active = false; }}
    onBlur={() => { pointer.current.active = false; }}
    onKeyDown={e => {
      if (e.key === 'Escape') { pointer.current.active = false; return; }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault(); const box = e.currentTarget.getBoundingClientRect();
      if (!pointer.current.active) pointer.current = { x: box.width * .3, y: box.height * .55, active: true, keyboard: true };
      pointer.current.keyboard = true;
      pointer.current.x = clamp(pointer.current.x + (e.key === 'ArrowRight' ? 30 : e.key === 'ArrowLeft' ? -30 : 0), 0, box.width);
      pointer.current.y = clamp(pointer.current.y + (e.key === 'ArrowDown' ? 30 : e.key === 'ArrowUp' ? -30 : 0), 0, box.height);
    }} />;
}
