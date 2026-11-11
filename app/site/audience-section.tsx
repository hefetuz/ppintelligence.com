'use client';
/* oxlint-disable next/no-img-element -- Local SVG identity supplies the static reduced-motion fallback. */
import { useEffect, useRef } from 'react';
import {
  Cpu,
  Landmark,
  CircleDollarSign,
  Rocket,
  Layers3,
  Building2,
  UserRound,
  BriefcaseBusiness,
} from '@/components/sharp-icons';
import { assetUrl } from '../asset-url';
import { siteHref } from './links';
import './audience-section.css';

const cards = [
  ['fintech', 'Banks/Credit Unions', CircleDollarSign, ''],
  ['technology', 'Tech Companies', Cpu, ''],
  ['leaders', 'Other Regulated Industries', BriefcaseBusiness, ''],
  ['established', 'Non-Profit Leaders', Building2, ''],
  ['banking', 'Fintechs', Landmark, ''],
  ['midsize', 'SMEs', Layers3, ''],
  ['startups', 'Startups', Rocket, 'Seed to exit'],
  ['founders', 'Founders', UserRound, 'Early stage / pre-seed'],
] as const;

/** The existing canvas coin docks into the centre; no second animated coin. */
export function AudienceSection() {
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {node.dataset.frameVisible='true';observer.disconnect();}
    }, {threshold:0.3});
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <section
      ref={section}
      id="audience"
      tabIndex={-1}
      data-section="audience"
      className="audience-stage"
      data-audience-stage
      aria-labelledby="audience-heading"
    >
      <div className="audience-paper" aria-hidden="true" />
      <svg className="audience-layout-frame" aria-hidden="true" width="100%" height="100%">
        <rect x="0.5" y="0.5" width="calc(100% - 1px)" height="calc(100% - 1px)" pathLength="1" />
      </svg>
      <div
        className="audience-dock-surface"
        data-audience-dock-surface
        aria-hidden="true"
      />
      <div className="audience-layout">
        <header className="audience-copy">
          <p className="audience-eyebrow">Who we work with</p>
          <h2 id="audience-heading" tabIndex={-1}>
            From startup to
            <br />
            established business.
          </h2>
          <p className="audience-description">
            Independent advice for founders and business leaders, from early
            decisions to the next stage of growth. With particular experience in
            fintech, banking and technology.
          </p>
          <a className="audience-company-link" href={siteHref('/about/')}>
            About Pretty Penny
          </a>
        </header>
        <div className="audience-diagram">
          <div className="audience-weave" aria-hidden="true" />
          <div className="audience-coin-frame" data-coin-dock>
            <div className="audience-coin-inset" />
            <img
              className="audience-coin-fallback"
              src={assetUrl('coin-rest.svg')}
              alt="Pretty Penny coin"
              width={60}
              height={60}
            />
          </div>
          <ul
            className="audience-cards"
            aria-label="Sectors, business stages and people we work with"
          >
            {cards.map(([id, label, Icon, detail]) => (
              <li key={id} className={`audience-card audience-card--${id}`}>
                <Icon size={15} strokeWidth={1.2} aria-hidden="true" />
                <span>{label}{detail && <small>{detail}</small>}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
