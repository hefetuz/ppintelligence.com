import { useId, type ReactNode } from 'react';
import { project, topPlane } from './company-visuals';

type Plan = readonly [x: number, y: number, width: number, depth: number];
type Venture = 'pretty-penny' | 'apkallu' | 'nexus';
type Surface = 'base' | 'structure' | 'subject';

function edge(x: number, y: number, z: number) {
  return project([x, y, z]).join(' ');
}

function Solid({ plan: [x, y, w, d], z = 0, height, radius = 4, tone = 'structure' }: {
  plan: Plan; z?: number; height: number; radius?: number; tone?: Surface;
}) {
  const right = x + w;
  const front = y + d;
  const top = z + height;
  // The positive x and y edges face the camera. Leave the shared corner uninked.
  const nearEdge = (level: number) =>
    `L${edge(right, front - radius, level)} Q${edge(right, front, level)} ${edge(right - radius, front, level)} L${edge(x + radius, front, level)}`;
  const corner = (level: number) => edge(right - radius / 4, front - radius / 4, level);
  return (
    <g className={`venture-iso__solid venture-iso__solid--${tone}`}>
      <path className="venture-iso__wall" d={
        `M${edge(right, y + radius, top)} ${nearEdge(top)} L${edge(x + radius, front, z)} L${edge(right - radius, front, z)} Q${edge(right, front, z)} ${edge(right, front - radius, z)} L${edge(right, y + radius, z)} Z`
      } />
      <path className="venture-iso__end" d={
        `M${edge(right, y + radius, top)} L${edge(right, front - radius, top)} Q${edge(right, front - radius / 2, top)} ${corner(top)} L${corner(z)} Q${edge(right, front - radius / 2, z)} ${edge(right, front - radius, z)} L${edge(right, y + radius, z)} Z`
      } />
      <path className="venture-iso__crease" d={`M${edge(right, y + radius, z)} ${nearEdge(z)}`} />
      <rect className="venture-iso__top" x={x} y={y} width={w} height={d} rx={radius} transform={topPlane(0, 0, top)} />
    </g>
  );
}

function Fasteners({ points, z }: { points: readonly (readonly [number, number])[]; z: number }) {
  return (
    <g transform={topPlane(0, 0, z)}>
      {points.map(([x, y]) => (
        <g key={`${x},${y}`} transform={`translate(${x} ${y})`} className="venture-iso__fastener">
          <circle r="2.1" />
          <path d="M-1.1 0h2.2" />
        </g>
      ))}
    </g>
  );
}

function Bench({ children }: { children: ReactNode }) {
  const shadow = useId();
  return (
    <>
      <defs>
        <radialGradient id={shadow}>
          <stop offset=".35" stopColor="#070b10" stopOpacity=".55" />
          <stop offset="1" stopColor="#070b10" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="55" rx="128" ry="36" fill={`url(#${shadow})`} />
      <Solid plan={[-88, -56, 176, 112]} z={-8} height={8} radius={8} tone="base" />
      <Solid plan={[-99, -65, 198, 130]} height={10} radius={7} tone="base" />
      <rect className="venture-iso__crease" x="-93" y="-59" width="186" height="118" rx="5" transform={topPlane(0, 0, 10)} />
      <Fasteners points={[[-88,-54], [88,-54], [-88,54], [88,54]]} z={10} />
      {children}
    </>
  );
}

function StrategyBench() {
  return (
    <Bench>
      <Solid plan={[-72, -42, 82, 84]} z={10} height={22} radius={10} tone="subject" />
      <g transform={topPlane(-31, 0, 32)}>
        <circle className="venture-iso__inset" r="31" />
        <circle className="venture-iso__crease" r="25" />
        {Array.from({ length: 24 }, (_, tick) => (
          <path key={tick} className="venture-iso__mark" transform={`rotate(${tick * 15})`} d={`M0 -28v${tick % 6 === 0 ? 5 : 2.5}`} />
        ))}
        <path className="venture-iso__accent" d="M-4 5 2-20 4 5 0 9Z" transform="rotate(38)" />
        <circle className="venture-iso__inset" r="4" />
      </g>
      <Fasteners points={[[-64,-34], [2,-34], [-64,34], [2,34]]} z={32} />
      <Solid plan={[27, -44, 43, 88]} z={10} height={12} />
      <g transform={topPlane(0, 0, 22)}>
        <rect className="venture-iso__inset" x="39" y="-36" width="9" height="72" rx="2" />
        {Array.from({ length: 10 }, (_, tick) => (
          <path key={tick} className="venture-iso__mark" d={`M66 ${-34 + tick * 7.5}h-${tick % 3 === 0 ? 9 : 5}`} />
        ))}
      </g>
      <Solid plan={[34, 7, 24, 15]} z={22} height={8} radius={3} tone="subject" />
      <path className="venture-iso__mark" d="M38 14h16" transform={topPlane(0, 0, 30)} />
    </Bench>
  );
}

const ports = [
  { x: -61, y: -38, route: 'M-61 -38V-20Q-61 -10-51 -10H-17' },
  { x:  62, y: -38, route: 'M62 -38V-22Q62 -14 54 -14H17' },
  { x: -61, y:  37, route: 'M-61 37V25Q-61 17-53 17H-17' },
  { x:  62, y:  37, route: 'M62 37V28Q62 19 53 19H17' },
];

function NetworkPanel() {
  return (
    <Bench>
      <Solid plan={[-79, -53, 159, 106]} z={10} height={9} radius={8} />
      <g transform={topPlane(0, 0, 19)}>
        {ports.map(({ route }, index) => <path key={route} className={index === 0 ? 'venture-iso__trace venture-iso__trace--active' : 'venture-iso__trace'} d={route} />)}
      </g>
      <Solid plan={[-21, -27, 42, 54]} z={19} height={17} radius={7} tone="subject" />
      <g transform={topPlane(0, 0, 36)}>
        <rect className="venture-iso__inset" x="-13" y="-17" width="26" height="34" rx="4" />
        <path className="venture-iso__accent" d="M-7 -5h14v3H-7z" />
        <path className="venture-iso__mark" d="M-7 3H7m-14 5H7" />
      </g>
      {ports.map(({ x, y }) => (
        <g key={`${x},${y}`}>
          <Solid plan={[x - 12, y - 10, 24, 20]} z={19} height={12} radius={4} />
          <g transform={topPlane(x, y, 31)}>
            <circle className="venture-iso__inset" r="6.4" />
            <circle className="venture-iso__mark" r="3.1" />
          </g>
        </g>
      ))}
    </Bench>
  );
}

function VendorArchive() {
  const face = project([0, 25, 0]);
  return (
    <Bench>
      <Solid plan={[-63, -54, 126, 79]} z={10} height={87} radius={6} />
      <rect className="venture-iso__crease" x="-56" y="-48" width="112" height="67" rx="4" transform={topPlane(0, 0, 97)} />
      <Fasteners points={[[-50,-42], [50,-42], [-50,13], [50,13]]} z={97} />
      <g transform={`matrix(.91 .4 0 -1 ${face.join(' ')})`}>
        <rect className="venture-iso__inset" x="-54" y="68" width="108" height="22" rx="3" />
        {[19, 43].map(level => (
          <g key={level}>
            <rect className="venture-iso__drawer" x="-54" y={level} width="108" height="19" rx="3" />
            <rect className="venture-iso__inset" x="-18" y={level + 6} width="36" height="6" rx="2" />
            <path className="venture-iso__mark" d={`M-12 ${level + 9}h24`} />
          </g>
        ))}
      </g>
      <Solid plan={[-49, 25, 98, 46]} z={70} height={7} radius={3} tone="base" />
      <Solid plan={[-45, 31, 90, 38]} z={77} height={2} radius={2} />
      {[34, 45, 56].map((y, index) => (
        <g key={y}>
          <Solid plan={[-37, y, 74, 3]} z={79} height={13 - index * 2} radius={1} tone="subject" />
          <Solid plan={[-25 + index * 17, y, 14, 3]} z={92 - index * 2} height={3} radius={1} tone="subject" />
        </g>
      ))}
      <Solid plan={[-52, 69, 104, 7]} z={68} height={16} radius={2} tone="subject" />
      <path className="venture-iso__accent" d="M-11 0h22v2h-22z" transform={topPlane(0, 72, 84)} />
    </Bench>
  );
}

const scenes = { 'pretty-penny': <StrategyBench />, apkallu: <NetworkPanel />, nexus: <VendorArchive /> };

export function VentureArtwork({ venture }: { venture: Venture }) {
  return <svg className="company-venture__art" viewBox="-192 -156 384 284" fill="none" aria-hidden="true">{scenes[venture]}</svg>;
}
