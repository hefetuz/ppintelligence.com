'use client';

import { EmployerLogo } from './employer-logo';
import { useEffect, useRef } from 'react';
import { founder } from './content';

export function BrandMarquee({ paused }: { paused: boolean }) {
  const career = founder?.career ?? [];
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    let visible = false;
    const sync = () => {
      track.style.animationPlayState = !paused && visible && !document.hidden
        ? 'running'
        : 'paused';
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    const handleVisibility = () => sync();
    sync();
    observer.observe(section);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      track.style.removeProperty('animation-play-state');
    };
  }, [paused]);

  if (!career.length) return null;
  return (
    <section
      ref={sectionRef}
      id="currency-ribbon"
      className={'brand-marquee currency-ribbon' + (paused ? ' is-paused' : '')}
      aria-label="Deniz Tudor’s previous career experience"
    >
      <div className="currency-ribbon-window">
        <div ref={trackRef} className="currency-ribbon-track">
          {[0, 1].map((copy) => (
            <div
              className="currency-ribbon-set"
              key={copy}
              aria-hidden={copy === 1}
            >
              {career.map((name) => (
                <span
                  className="brand-marquee-item"
                  key={name}
                >
                  <EmployerLogo name={name} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
