'use client';
/* oxlint-disable next/no-img-element -- The self-hosted vector mark also supports the portable build. */
import {
  ChartNoAxesCombined,
  CircleDollarSign,
  Compass,
  Cpu,
  Gauge,
  Landmark,
  Layers3,
  ScanLine,
  ShieldCheck,
  UsersRound,
  Workflow,
  Scale,
  Timer,
} from '@/components/sharp-icons';
import { assetUrl } from '../asset-url';
import './company-context.css';
import { ConstructionPortico } from './construction-portico';

const inputs = [
  { label: 'Business priorities', Icon: Compass },
  { label: 'Growth options', Icon: ChartNoAxesCombined },
  { label: 'Resources', Icon: UsersRound },
  { label: 'Operations', Icon: Workflow },
  { label: 'Risk exposure', Icon: ShieldCheck },
  { label: 'Assumptions', Icon: ScanLine },
  { label: 'Market conditions', Icon: Gauge },
  { label: 'Economic context', Icon: CircleDollarSign },
  { label: 'Trade-offs', Icon: Scale },
  { label: 'Timing & constraints', Icon: Timer },
];

export function DecisionContext() {
  return (
    <div className="decision-room">
      <p className="decision-room__caption">Business decision context</p>
      <div className="decision-room__diagram">
        <div className="decision-room__portico-crop"><ConstructionPortico /></div>
        <svg className="decision-room__mobile-pediment" viewBox="0 0 600 100" fill="none" aria-hidden="true">
          <path d="M1 64L300 12L599 64H1ZM23 60L300 17L577 60M1 69H599M1 74H599M1 79H599M1 83H599V99H1V83Z" />
          <path d="M300 0V8M0 50V59M600 50V59" strokeDasharray="2 3" />
        </svg>
        <ul className="decision-room__inputs" aria-label="Decision inputs">
          {inputs.map(({ label, Icon }) => (
            <li key={label}>
              <Icon size={16} strokeWidth={1.4} aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SectorOrbit() {
  return (
    <div className="company-orbit">
      <p className="company-orbit__legend">Sector focus</p>
      <div className="company-orbit__diagram">
        <svg
          className="company-orbit__guide"
          viewBox="0 0 520 290"
          aria-hidden="true"
          focusable="false"
        >
          <ellipse
            cx="260"
            cy="151"
            rx="186"
            ry="94"
            fill="none"
            stroke="#b6b9aa"
            strokeWidth=".8"
          />
          <path
            d="M260,24V63M68,161H112M408,161H452"
            stroke="#b6b9aa"
            strokeWidth=".8"
          />
          <g fill="#a3aa9b">
            <circle cx="260" cy="57" r="2" />
            <circle cx="74" cy="151" r="2" />
            <circle cx="446" cy="151" r="2" />
          </g>
        </svg>
        <div className="company-orbit__cloth" aria-hidden="true">
          <span className="company-orbit__cloth-seam" />
          <img src={assetUrl('pp-logo.svg')} alt="" width={48} height={53} />
        </div>
        <ul className="company-orbit__sectors" aria-label="Sector focus">
          <li className="company-orbit__card company-orbit__card--fintech">
            <CircleDollarSign size={18} strokeWidth={1.3} aria-hidden="true" />
            <span>Fintech</span>
          </li>
          <li className="company-orbit__card company-orbit__card--banking">
            <Landmark size={18} strokeWidth={1.3} aria-hidden="true" />
            <span>Banking</span>
          </li>
          <li className="company-orbit__card company-orbit__card--technology">
            <Cpu size={18} strokeWidth={1.3} aria-hidden="true" />
            <span>Technology</span>
          </li>
        </ul>
      </div>
      <div className="company-orbit__stages">
        <p>
          <Layers3 size={14} strokeWidth={1.4} aria-hidden="true" />
          Business stages
        </p>
        <ul aria-label="Business stages">
          <li>Startups</li>
          <li>Small &amp; midsize</li>
          <li>Established companies</li>
        </ul>
      </div>
    </div>
  );
}


