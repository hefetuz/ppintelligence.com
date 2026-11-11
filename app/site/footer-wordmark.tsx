'use client';
import { useEffect, useId, useRef } from 'react';
import type { PointerEvent } from 'react';
import { FOOTER_LOGO_PATHS } from './footer-logo-paths';

/** Exact supplied horizontal identity, with a local pointer-following reflection. */
export function FooterWordmark() {
  const id = useId().replace(/:/g, '');
  const mask = `penny-footer-mask-${id}`;
  const pattern = `penny-footer-engraving-${id}`;
  const light = `penny-footer-light-${id}`;
  const spot = useRef<SVGCircleElement>(null);
  const frame = useRef(0);
  const current = useRef({ x: 287, y: 30 });
  const target = useRef({ x: 287, y: 30 });
  const reduced = useRef(false);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reduced.current = media.matches;
    };
    update();
    media.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
      cancelAnimationFrame(frame.current);
    };
  }, []);
  const paint = () => {
    frame.current = 0;
    const a = current.current,
      b = target.current;
    const ease = reduced.current ? 1 : 0.22;
    a.x += (b.x - a.x) * ease;
    a.y += (b.y - a.y) * ease;
    spot.current?.setAttribute('cx', String(a.x));
    spot.current?.setAttribute('cy', String(a.y));
    if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 0.1)
      frame.current = requestAnimationFrame(paint);
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    target.current = {
      x: ((event.clientX - bounds.left) / bounds.width) * 574.78,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    };
    if (event.type === 'pointerenter') current.current = { ...target.current };
    event.currentTarget.dataset.hover = 'true';
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  };
  return (
    <svg
      className="footer-engraving"
      viewBox="0 0 574.78 100"
      fill="none"
      aria-hidden="true"
      onPointerEnter={move}
      onPointerMove={move}
      onPointerLeave={(event) => {
        event.currentTarget.dataset.hover = 'false';
        cancelAnimationFrame(frame.current);
        frame.current = 0;
      }}
    >
      <defs>
        <pattern
          id={pattern}
          width="40"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          {Array.from({ length: 16 }, (_, i) => (
            <path
              key={i}
              d={`M-20 ${i * 2 - 12}C-7 ${i * 2 - 20} 7 ${i * 2 + 8} 20 ${i * 2}S47 ${i * 2 - 8} 60 ${i * 2}`}
              stroke="#b4c3d0"
              strokeWidth=".16"
              opacity=".22"
            />
          ))}
        </pattern>
        <radialGradient id={light}>
          <stop stopColor="#e5edf6" stopOpacity=".5" />
          <stop offset=".35" stopColor="#bbd0e2" stopOpacity=".2" />
          <stop offset="1" stopColor="#bbd0e2" stopOpacity="0" />
        </radialGradient>
        <mask
          id={mask}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="574.78"
          height="100"
        >
          {FOOTER_LOGO_PATHS.map((d, i) => (
            <path key={i} d={d} fill="white" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${mask})`}>
        <path d="M0 0H575V100H0Z" fill="#9bb0c1" fillOpacity=".045" />
        <path d="M0 0H575V100H0Z" fill={`url(#${pattern})`} />
        <circle
          ref={spot}
          className="footer-engraving-hover"
          cx="287"
          cy="30"
          r="125"
          fill={`url(#${light})`}
        />
      </g>
      <g stroke="#9fb0c0" strokeWidth=".16" opacity=".13">
        {FOOTER_LOGO_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
