'use client';

import { useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number; light: number; seed: number; glyph: string };
type CoinPoint = { x: number; y: number; z: number; nx: number; nz: number; rim: boolean; engraving: boolean };

// A shallow cylinder with two engraved faces and a reeded edge.
function makeCoin(): CoinPoint[] {
  const result: CoinPoint[] = [];
  for (const side of [-1, 1]) {
    for (let y = -.98; y <= .98; y += .047) {
      for (let x = -.98; x <= .98; x += .047) {
        const radius = Math.hypot(x, y);
        if (radius > 1) continue;
        const ring = Math.abs(radius - .82) < .025;
        const emblem = [-.16, 0, .16].some(offset => Math.abs(Math.hypot(x / .43, (y - offset) / .22) - 1) < .11);
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

function HandField({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const pointer = useRef({ x: -1000, y: -1000, active: false });
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    const source = new Image();
    const coin = makeCoin();
    let points: Point[] = [];
    let width = 0, height = 0, frame = 0, last = 0, elapsed = 0, cell = 5;
    let disposed = false, visible = true, loaded = false, revealed = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smooth = { x: -1000, y: -1000, strength: 0 };

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      width = box.width; height = box.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!loaded || !width || !height) return;
      // Derive the character field directly from the supplied artwork.
      const sample = document.createElement('canvas');
      const sc = sample.getContext('2d', { willReadFrequently: true });
      if (!sc) return;
      const artWidth = width < 640 ? width * 1.5 : width * 1.06;
      cell = width < 640 ? 3.5 : Math.max(4, width / 330);
      const columns = Math.round(artWidth / cell);
      sample.width = columns; sample.height = Math.round(columns * source.height / source.width);
      sc.drawImage(source, 0, 0, sample.width, sample.height);
      const pixels = sc.getImageData(0, 0, sample.width, sample.height).data;
      const scale = artWidth / columns, left = (width - artWidth) / 2;
      const top = height * .51 - source.height * .535 / source.width * artWidth;
      const clearance = Math.min(76, Math.max(37, width * .052));
      const glyphs = ' .·:+*=#%@';
      points = [];
      for (let y = 0; y < sample.height; y++) {
        for (let x = 0; x < columns; x++) {
          const i = (y * columns + x) * 4;
          const light = (pixels[i] * .2126 + pixels[i + 1] * .7152 + pixels[i + 2] * .0722) / 255;
          if (light < .12) continue;
          const seed = ((x * 127.1 + y * 311.7) % 997) / 997;
          const density = Math.min(9, Math.max(1, Math.floor((1 - light) * 11 + 2 + seed * 2)));
          points.push({ x: left + x * scale + artWidth * .023 + (x < columns * .477 ? -clearance : clearance), y: top + y * scale, light, seed, glyph: glyphs[density] });
        }
      }
    };

    const render = (time: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(render);
      if (time - last < 32 || !visible || document.hidden) { if (document.hidden) last = time; return; }
      const delta = Math.min(time - last, 50); last = time;
      const moving = !pausedRef.current && !reduceMotion.matches;
      if (moving) elapsed += delta / 1000;
      const target = pointer.current;
      if (target.active && smooth.strength < .01) { smooth.x = target.x; smooth.y = target.y; }
      smooth.x += (target.x - smooth.x) * .16; smooth.y += (target.y - smooth.y) * .16;
      smooth.strength += ((target.active ? 1 : 0) - smooth.strength) * .1;
      ctx.fillStyle = '#0b0e16'; ctx.fillRect(0, 0, width, height);
      const radius = Math.min(width * .24, 185);
      if (smooth.strength > .01) {
        const glow = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, radius);
        glow.addColorStop(0, `rgba(193,204,221,${.045 * smooth.strength})`);
        glow.addColorStop(1, 'rgba(193,204,221,0)');
        ctx.fillStyle = glow; ctx.fillRect(smooth.x - radius, smooth.y - radius, radius * 2, radius * 2);
      }
      ctx.font = `${cell * .91}px ui-monospace, SFMono-Regular, Consolas, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const p of points) {
        const dx = p.x - smooth.x, dy = p.y - smooth.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - distance / radius);
        const light = proximity * proximity * smooth.strength;
        const wave = reduceMotion.matches ? 0 : Math.sin(p.x * .007 + elapsed * .62) * 2.5 + Math.sin(p.y * .012 + elapsed * .8) * 1.4;
        const breathe = reduceMotion.matches ? 0 : Math.sin(elapsed * .42) * 3;
        const shift = reduceMotion.matches ? 0 : light * 13 * Math.sin(elapsed * 1.1 + p.seed * 6.28);
        const x = p.x + (p.x < width / 2 ? breathe : -breathe) + dx / Math.max(1, distance) * shift;
        const y = p.y + wave + dy / Math.max(1, distance) * shift;
        const opacity = Math.min(.98, .18 + (1 - p.light) * .24 + light * .85);
        ctx.fillStyle = `rgba(210,215,225,${opacity})`;
        ctx.fillText(p.glyph, x, y);
      }
      // Share the hands' clock so pause/resume never resets the rotation.
      const angle = elapsed * Math.PI * 2 / 5.5 + .24;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const coinRadius = Math.min(62, Math.max(30, width * .043));
      const coinX = width / 2, coinY = height * .5;
      const tilt = -.12;
      const projected = coin.map(p => ({
        ...p,
        rx: p.x * cos + p.z * sin,
        depth: -p.x * sin + p.z * cos,
        normalX: p.nx * cos + p.nz * sin,
        normalZ: -p.nx * sin + p.nz * cos,
      })).filter(p => p.normalZ > -.08).sort((a, b) => a.depth - b.depth);
      ctx.font = `${Math.max(2.4, coinRadius * .05)}px ui-monospace, SFMono-Regular, Consolas, monospace`;
      for (const p of projected) {
        const perspective = 1 + p.depth * .075;
        const x = (p.rx * Math.cos(tilt) - p.y * Math.sin(tilt)) * coinRadius * perspective;
        const y = (p.rx * Math.sin(tilt) + p.y * Math.cos(tilt)) * coinRadius * perspective;
        const lighting = Math.max(0, -.45 * p.normalX + .8 * p.normalZ);
        const shine = Math.pow(Math.max(0, -.65 * p.normalX + .76 * p.normalZ), 14);
        const alpha = Math.min(1, .32 + lighting * .48 + shine * .25 + (p.rim ? .14 : 0));
        ctx.fillStyle = p.engraving ? `rgba(255,230,168,${alpha})` : `rgba(201,162,93,${alpha * .8})`;
        ctx.fillText(p.engraving ? '#' : p.rim ? '+' : '·', coinX + x, coinY + y);
      }
      if (loaded && !revealed) { revealed = true; setReady(true); }
    };
    source.onload = () => { if (!disposed) { loaded = true; resize(); } };
    source.src = '/hands.png';
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); intersection.observe(canvas);
    resize(); frame = requestAnimationFrame(render);
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); source.onload = null; };
  }, []);

  return <div className="artwork">
    <img className={`artwork-fallback ${ready ? 'is-ready' : ''}`} src="/hands.png" alt="" aria-hidden="true" />
    <canvas ref={canvasRef} className="hand-canvas" tabIndex={0} role="img"
      aria-label="Birbirine uzanan iki ASCII elin arasında altın renkli bir coin sürekli dönüyor. Işığı fareyle, dokunarak veya yön tuşlarıyla gezdirin."
      onPointerMove={(e) => { const box = e.currentTarget.getBoundingClientRect(); pointer.current = { x: e.clientX - box.left, y: e.clientY - box.top, active: true }; }}
      onPointerDown={(e) => { const box = e.currentTarget.getBoundingClientRect(); pointer.current = { x: e.clientX - box.left, y: e.clientY - box.top, active: true }; }}
      onPointerLeave={() => { pointer.current.active = false; }}
      onPointerCancel={() => { pointer.current.active = false; }}
      onBlur={() => { pointer.current.active = false; }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { pointer.current.active = false; return; }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault(); const box = e.currentTarget.getBoundingClientRect();
        if (!pointer.current.active) pointer.current = { x: box.width / 2, y: box.height / 2, active: true };
        pointer.current.x = Math.max(0, Math.min(box.width, pointer.current.x + (e.key === 'ArrowRight' ? 30 : e.key === 'ArrowLeft' ? -30 : 0)));
        pointer.current.y = Math.max(0, Math.min(box.height, pointer.current.y + (e.key === 'ArrowDown' ? 30 : e.key === 'ArrowUp' ? -30 : 0)));
      }} />
  </div>;
}

export default function Home() {
  const [paused, setPaused] = useState(false);
  return <main className="hero">
    <h1 className="sr-only">Deniz K. Tudor</h1>
    <header className="hero-header">
      <a className="identity" href="/" aria-label="Deniz K. Tudor ana sayfa"><span className="orbit-mark" aria-hidden="true"><span /></span><span className="wordmark">DENIZ K. TUDOR</span></a>
      <button className="motion-toggle" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? 'Animasyonu devam ettir' : 'Animasyonu duraklat'}><span>{paused ? 'PLAY' : 'PAUSE'}</span><span className={paused ? 'play-symbol' : 'pause-symbol'} aria-hidden="true" /></button>
    </header>
    <HandField paused={paused} />
    <footer className="hero-footer">
      <div className="nameplate"><span className="status-dot" /> DENIZ TUDOR</div>
      <p className="interaction-hint"><span className="hint-desktop">MOVE TO CONNECT</span><span className="hint-touch">TOUCH TO CONNECT</span><span className="hint-cross" aria-hidden="true">+</span></p>
    </footer>
  </main>;
}
