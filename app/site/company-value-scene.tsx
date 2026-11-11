'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- A single labelled multi-layer animated illustration. */
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { BarChart3, Compass, ShieldCheck, Target, Wallet, TrendingUp, Globe2, GitBranch, Landmark, Scale, Layers3, CheckCircle2 } from '@/components/sharp-icons';
import { assetUrl } from '../asset-url';
import './company-value-scene.css';

const records = [
  {
    raw: 'financial-performance.svg',
    clean: 'financial-performance-analysis.svg',
    x: -250,
    width: 620,
    height: 230,
  },
  {
    raw: 'business-priorities.svg',
    clean: 'business-priorities-analysis.svg',
    x: 210,
    width: 790,
    height: 230,
  },
  {
    raw: 'risk-exposure.svg',
    clean: 'risk-exposure-analysis.svg',
    x: -80,
    width: 660,
    height: 205,
  },
  {
    raw: 'economic-context.svg',
    clean: 'economic-context-analysis.svg',
    x: 280,
    width: 590,
    height: 245,
  },
  {
    raw: 'cash-flow.svg',
    clean: 'cash-flow-analysis.svg',
    x: -290,
    width: 730,
    height: 245,
  },
  {
    raw: 'scenario-analysis.svg',
    clean: 'scenario-analysis-analysis.svg',
    x: 90,
    width: 690,
    height: 220,
  },
  {
    raw: 'capital-allocation.svg',
    clean: 'capital-allocation-analysis.svg',
    x: 290,
    width: 560,
    height: 210,
  },
  {
    raw: 'decision-brief.svg',
    clean: 'decision-brief-analysis.svg',
    x: -190,
    width: 710,
    height: 230,
  },
];
const calloutLabels = [
  ['FINANCIAL PERFORMANCE', 'STRATEGIC PRIORITIES'],
  ['RISK EXPOSURE', 'DECISION CONTEXT'],
  ['CASH FLOW', 'BUSINESS OUTLOOK'],
  ['MARKET CONDITIONS', 'GROWTH OPTIONS'],
  ['CAPITAL ALLOCATION', 'TRADE-OFFS'],
  ['SCENARIO ANALYSIS', 'INFORMED DECISIONS'],
] as const;
const calloutIcons = [BarChart3, Target, ShieldCheck, Compass, Wallet, TrendingUp, Globe2, GitBranch, Landmark, Scale, Layers3, CheckCircle2];
const texture = (name: string) =>
  assetUrl(`assets/company/pretty-penny-records/${name}`);

export function CompanyValueScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1440);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(Math.min(element.clientWidth, innerHeight * .42 * 1440 / 520));
    const resize = new ResizeObserver(measure);
    window.addEventListener('resize', measure);
    measure();
    resize.observe(element);
    let visible = false;
    const sync = () => setPlaying(visible && !document.hidden);
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 },
    );
    intersection.observe(element);
    document.addEventListener('visibilitychange', sync);
    return () => {
      resize.disconnect();
      window.removeEventListener('resize', measure);
      intersection.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  const cardStyle = (
    record: (typeof records)[number],
    index: number,
    clean = false,
  ): CSSProperties =>
    ({
      '--phase': `${index * -3.5}s`,
      '--record-x': `${record.x}px`,
      '--record-turn': `${index % 2 ? 0.7 : -0.6}deg`,
      width: record.width,
      height: record.height,
      backgroundImage: `url("${texture(clean ? record.clean : record.raw)}")`,
    }) as CSSProperties;

  return (
    <div
      ref={ref}
      className="company-value-scene reference-record-scene"
      data-playing={playing}
      style={{ height: (width * 520) / 1440 }}
      role="img"
      aria-label="Pretty Penny financial, risk and strategy reports flow through an analysis sheet and emerge as sheets of illustrated Pretty Penny banknotes representing business value."
    >
      <div
        className="record-scene"
        style={{ left: '50%', transform: `translateX(${-width / 2}px) scale(${width / 1440})` }}
        aria-hidden="true"
      >
        <div className="record-scene__layers">
          <div className="record-scene__layer">
            <div className="record-scene__plane record-scene__motes">
              {Array.from({ length: 12 }, (_, i) => (
                <i
                  key={i}
                  style={
                    {
                      '--phase': `${i * -2.3}s`,
                      '--record-x': `${((i % 5) - 2) * 180}px`,
                      width: 90 + (i % 3) * 45,
                      background:
                        i % 3 === 0
                          ? '#d8b17b'
                          : i % 3 === 1
                            ? '#315d78'
                            : '#a4b1b5',
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          </div>
          <div className="record-scene__layer">
            <div className="record-scene__plane record-scene__raw">
              <div className="record-scene__raw-clip">
                {Array.from({ length: 12 }, (_, index) => (
                  <div
                    key={index}
                    className="record-scene__card"
                    style={
                      {
                        ...cardStyle(records[index % records.length], index),
                        backgroundImage: `url("${texture(records[index % records.length].raw)}")`,
                        '--phase': `${index * -2.333}s`,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="record-scene__layer">
            <div className="record-scene__plane">
              <div className="record-scene__sheet">
                <div className="record-scene__glass" />
                <div className="record-scene__feed">
                  {Array.from({ length: 32 }, (_, index) => {
                    const base = records[index % records.length];
                    const record = {
                      ...base,
                      clean: base.clean,
                      x: ((index * 167) % 900) - 450,
                      width: base.width * 0.75,
                      height: base.height * 0.82,
                    };
                    return (
                      <div
                        key={index}
                        className="record-scene__card record-scene__card--clean"
                        style={
                          {
                            ...cardStyle(record, index, true),
                            '--phase': `${index * -0.875}s`,
                          } as CSSProperties
                        }
                      />
                    );
                  })}
                </div>
                <div className="record-scene__output">
                  {records.slice(0, 5).map((record, index) => (
                    <div
                      key={record.raw + index}
                      className="record-scene__card record-scene__card--value"
                      style={
                        {
                          ...cardStyle(record, index, true),
                          backgroundImage: `url("${texture('business-value.svg')}")`,
                          width: 1148,
                          height: 400,
                          '--record-x': '0px',
                          '--record-turn': '0deg',
                          '--phase': `${index * -5.6}s`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
                <div className="record-scene__wash" />
                <div className="record-scene__scan" />
                <div className="record-scene__veil" />
                <div className="record-scene__stroke" />
              </div>
            </div>
          </div>
        </div>
        <svg
          className="record-scene__callouts"
          viewBox="0 0 1440 520"
          fill="none"
        >
          {Array.from({ length: 12 }, (_, index) => {
            const left = index % 2 === 0;
            const Icon = calloutIcons[index];
            return (
              <g
                key={index}
                className="record-scene__callout record-scene__callout--tracked"
                style={{ '--phase': `${index * -2.333}s` } as CSSProperties}
              >
                <path
                  className="record-scene__leader"
                  d={left ? 'M245 62H448L496 111' : 'M1198 90H1007L959 136'}
                  pathLength="1"
                  stroke="#959fa5"
                  strokeWidth=".7"
                />
                <text
                  className="record-scene__source"
                  x={left ? 245 : 1007}
                  y={left ? 51 : 79}
                  textAnchor="start"
                >
                  {
                    calloutLabels[Math.floor(index / 2) % calloutLabels.length][
                      left ? 0 : 1
                    ]
                  }
                </text>
                <Icon
                  x={left ? 222 : 984}
                  y={left ? 39 : 67}
                  width={14}
                  height={14}
                  stroke="#536b75"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
