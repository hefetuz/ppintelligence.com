'use client';
import { useEffect, useRef } from 'react';

export function SilverGeometry() {
  const stars = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = stars.current;
    if (!root) return;
    let visible = false;
    const sync = () => {
      root.dataset.playing = String(visible && !document.hidden);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(root);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return (
    <>
      <div className="silver-blueprint-sky" aria-hidden="true" />
      <div className="silver-hero-sky" aria-hidden="true" />
      <div ref={stars} className="silver-starfield" aria-hidden="true">
        <svg
          viewBox="0 0 1200 900"
          preserveAspectRatio="xMidYMid slice"
          fill="currentColor"
        >
          {[0, 1, 2].map((group) => (
            <g
              key={group}
              className={`silver-star-group silver-star-group-${group}`}
            >
              {Array.from({ length: 20 }, (_, i) => {
                const seed = i + group * 20;
                const x = 28 + ((seed * 193 + 71) % 1140);
                const y = 24 + ((seed * 137 + 37) % 700);
                return (
                  <circle
                    key={seed}
                    cx={x}
                    cy={y}
                    r={seed % 13 === 0 ? 1.15 : seed % 4 === 0 ? 0.75 : 0.45}
                    opacity={0.25 + (seed % 5) * 0.12}
                  />
                );
              })}
            </g>
          ))}
          <path
            d="M196 118v7m-3.5-3.5h7M1007 247v5m-2.5-2.5h5"
            fill="none"
            stroke="currentColor"
            strokeWidth=".7"
            opacity=".55"
          />
        </svg>
      </div>
      <div
        className="silver-geometry silver-geometry-blueprint"
        aria-hidden="true"
      >
        <svg viewBox="-600 -600 1200 1200" fill="none">
          <g transform="scale(1 1)" data-blueprint-plane="true">
            <g className="silver-radial-rays">
              {[0, 15, 45, 90, 135, 165, 180, 195, 225, 270, 315, 345].map(
                (degrees) => {
                  const angle = (degrees * Math.PI) / 180;
                  const x = (Math.cos(angle) * 920).toFixed(3);
                  const y = (Math.sin(angle) * 920).toFixed(3);
                  return (
                    <path
                      key={degrees}
                      d={`M0 0L${x} ${y}`}
                      pathLength="1"
                      data-blueprint-ray="true"
                    />
                  );
                },
              )}
            </g>
            <circle r="308" pathLength="1" data-blueprint-line="0" />
            <circle r="430" pathLength="1" data-blueprint-line="1" />
            <circle r="446" pathLength="1" data-blueprint-line="1" />
            <circle r="574" pathLength="1" data-blueprint-line="2" />
          </g>
        </svg>
      </div>
    </>
  );
}
