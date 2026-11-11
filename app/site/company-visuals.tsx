import { useId } from 'react';

type Point = readonly [number, number, number];
type Material = { top: string; side: string; end: string };

const ink = '#33433f';
const paper: Material = { top: '#f8f4e9', side: '#dcd4c3', end: '#e9e1d1' };
const stone: Material = { top: '#eee8da', side: '#c8bda9', end: '#dbd0bc' };
const steel: Material = { top: '#d6d9d2', side: '#8d9b96', end: '#b4beb6' };
const blue: Material = { top: '#315b73', side: '#193c50', end: '#264b62' };
const brass: Material = { top: '#d2b482', side: '#967545', end: '#b59562' };

// A common projection keeps the bench and its three smaller studies in one world.
export const project = ([x, y, z]: Point): [number, number] => [
  x * 0.91 - y * 0.77,
  x * 0.4 + y * 0.48 - z,
];
const points = (vertices: readonly Point[]) =>
  vertices.map((point) => project(point).join(',')).join(' ');
const line = (a: Point, b: Point) =>
  `M${project(a).join(',')}L${project(b).join(',')}`;
const frontPlane = (x: number, y: number, z: number) => {
  const [px, py] = project([x, y, z]);
  return `matrix(-.77 .48 0 -1 ${px} ${py})`;
};
export const topPlane = (x: number, y: number, z: number) => {
  const [px, py] = project([x, y, z]);
  return `matrix(.91 .4 -.77 .48 ${px} ${py})`;
};
const circlePath = (r: number) =>
  `M${r},0A${r},${r} 0 1 0 ${-r},0A${r},${r} 0 1 0 ${r},0Z`;
const annulus = (outer: number, inner: number) =>
  `${circlePath(outer)}${circlePath(inner)}`;

function Block({
  x,
  y,
  z,
  w,
  d,
  h,
  material = paper,
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  material?: Material;
}) {
  return (
    <g stroke={ink} strokeWidth="0.7" strokeLinejoin="round">
      <polygon
        fill={material.side}
        points={points([
          [x, y + d, z],
          [x + w, y + d, z],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ])}
      />
      <polygon
        fill={material.end}
        points={points([
          [x + w, y, z],
          [x + w, y + d, z],
          [x + w, y + d, z + h],
          [x + w, y, z + h],
        ])}
      />
      <polygon
        fill={material.top}
        points={points([
          [x, y, z + h],
          [x + w, y, z + h],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ])}
      />
    </g>
  );
}

function Screw({
  at,
  r = 1.8,
  plane = 'top',
}: {
  at: Point;
  r?: number;
  plane?: 'top' | 'front';
}) {
  return (
    <g
      transform={(plane === 'top' ? topPlane : frontPlane)(...at)}
      stroke={ink}
      strokeWidth="0.75"
    >
      <circle r={r} fill="#ddd8c9" />
      <path d={`M${-r * 0.5},${-r * 0.5}L${r * 0.5},${r * 0.5}`} />
    </g>
  );
}

function Puck({
  x,
  y,
  z,
  r,
  h,
  material = steel,
}: {
  x: number;
  y: number;
  z: number;
  r: number;
  h: number;
  material?: Material;
}) {
  const sections = Array.from({ length: 2 }, (_, side) => {
    const arc = Array.from(
      { length: 13 },
      (_, i) => (-0.15 + side * 0.65 + (i / 12) * 0.65) * Math.PI,
    );
    return [
      ...arc.map((a) => [x + Math.cos(a) * r, y + Math.sin(a) * r, z] as Point),
      ...arc
        .toReversed()
        .map((a) => [x + Math.cos(a) * r, y + Math.sin(a) * r, z + h] as Point),
    ];
  });
  return (
    <g stroke={ink} strokeWidth="0.65" strokeLinejoin="round">
      {sections.map((section, i) => (
        <polygon
          key={i}
          points={points(section)}
          fill={i === 0 ? material.end : material.side}
          stroke="none"
        />
      ))}
      <path
        d={`${line([x + r, y, z], [x + r, y, z + h])}${line([x, y + r, z], [x, y + r, z + h])}`}
        fill="none"
      />
      <circle transform={topPlane(x, y, z + h)} r={r} fill={material.top} />
    </g>
  );
}

function AxialCell({
  x,
  z,
  radius,
  depth,
  material,
  hollow = 0,
}: {
  x: number;
  z: number;
  radius: number;
  depth: number;
  material: Material;
  hollow?: number;
}) {
  return (
    <g stroke={ink} strokeWidth="0.7" strokeLinejoin="round">
      {Array.from({ length: 2 }, (_, side) => {
        const arc = Array.from(
          { length: 17 },
          (_, i) => (-0.24 + side * 0.51 + (i / 16) * 0.51) * Math.PI,
        );
        return (
          <polygon
            key={side}
            stroke="none"
            fill={side === 0 ? material.top : material.side}
            points={points([
              ...arc.map(
                (a) =>
                  [x, Math.cos(a) * radius, z + Math.sin(a) * radius] as Point,
              ),
              ...arc
                .toReversed()
                .map(
                  (a) =>
                    [
                      x + depth,
                      Math.cos(a) * radius,
                      z + Math.sin(a) * radius,
                    ] as Point,
                ),
            ])}
          />
        );
      })}
      <circle transform={frontPlane(x, 0, z)} r={radius} fill="none" />
      <path
        transform={frontPlane(x + depth, 0, z)}
        d={hollow ? annulus(radius, hollow) : circlePath(radius)}
        fillRule="evenodd"
        fill={material.end}
      />
    </g>
  );
}

function Rail({ y }: { y: number }) {
  return (
    <g>
      <Block x={-151} y={y - 6} z={10} w={14} d={12} h={5} material={steel} />
      <Block x={139} y={y - 6} z={10} w={14} d={12} h={5} material={steel} />
      <Block
        x={-148}
        y={y - 2.7}
        z={15}
        w={298}
        d={5.4}
        h={4.4}
        material={steel}
      />
      <path
        d={line([-148, y - 1.8, 19.4], [150, y - 1.8, 19.4])}
        stroke="#fcfbf3"
        strokeWidth="1"
      />
      <Screw at={[-145, y, 19.4]} r={1.4} />
      <Screw at={[146, y, 19.4]} r={1.4} />
    </g>
  );
}

function RegistrationPlate({ x, stage }: { x: number; stage: number }) {
  const outline = 'M-49,-58H49L57,-50V50L49,58H-49L-57,50V-50Z';
  const hole = circlePath(36);
  return (
    <g>
      <Block
        x={x - 10}
        y={-54}
        z={19.4}
        w={26}
        d={108}
        h={7}
        material={stone}
      />
      {[-44, 44].map((y) => (
        <g key={y}>
          <Block
            x={x - 12}
            y={y - 7}
            z={17.5}
            w={30}
            d={14}
            h={10}
            material={steel}
          />
          <Screw at={[x + 9, y, 27.5]} r={1.55} />
        </g>
      ))}
      <path
        d={line([x - 8, -54, 26.4], [x - 8, 54, 26.4])}
        stroke={ink}
        strokeWidth="0.65"
      />
      <path
        transform={frontPlane(x - 2, 0, 84.4)}
        d={`${outline}${hole}`}
        fillRule="evenodd"
        fill={stone.side}
        stroke={ink}
        strokeWidth="0.8"
      />
      <polygon
        points={points([
          [x - 2, -49, 142.4],
          [x + 5, -49, 142.4],
          [x + 5, 49, 142.4],
          [x - 2, 49, 142.4],
        ])}
        fill={paper.top}
        stroke={ink}
        strokeWidth="0.7"
      />
      <polygon
        points={points([
          [x - 2, 57, 34.4],
          [x + 5, 57, 34.4],
          [x + 5, 57, 134.4],
          [x - 2, 57, 134.4],
        ])}
        fill={stone.side}
        stroke={ink}
        strokeWidth="0.7"
      />
      <g transform={frontPlane(x + 5, 0, 84.4)} stroke={ink} strokeWidth="0.8">
        <path
          d={`${outline}${hole}`}
          fillRule="evenodd"
          fill={stage === 1 ? '#e6e7da' : paper.top}
        />
        <path
          d={annulus(40.5, 36)}
          fillRule="evenodd"
          fill={stage === 1 ? brass.top : steel.top}
        />
        <path
          d="M-45,-47H45V47H-45Z"
          fill="none"
          stroke="#b8b9a9"
          strokeWidth="0.65"
        />
        {stage < 2 && (
          <circle r="35.4" fill={stage === 0 ? '#e8ece4' : '#f7f2df'} />
        )}
        {stage === 0 && (
          <path
            d="M-35.4,0H35.4M0,-35.4V35.4"
            fill="none"
            stroke="#a7b2a5"
            strokeWidth="0.65"
          />
        )}
        {stage === 1 && (
          <path
            d="M-24,-25L24,25M-24,25L24,-25"
            fill="none"
            stroke="#c3b791"
            strokeWidth="0.65"
          />
        )}
      </g>
      {[-44, 44].flatMap((y) =>
        [-46, 46].map((z) => (
          <Screw
            key={`${y}-${z}`}
            at={[x + 5.3, y, 84.4 + z]}
            plane="front"
            r={2.25}
          />
        )),
      )}
      {[-46, 46].map((y) => (
        <g key={y}>
          <polygon
            points={points([
              [x + 5, y, 28],
              [x + 21, y, 28],
              [x + 5, y, 49],
            ])}
            fill={steel.end}
            stroke={ink}
            strokeWidth="0.7"
          />
          <Block
            x={x + 5}
            y={y - 3}
            z={27.5}
            w={16}
            d={6}
            h={2}
            material={steel}
          />
        </g>
      ))}
    </g>
  );
}

/** Three registered optical planes, held by actual carriages on a common bench. */
export function PerspectiveAssembly() {
  const hatch = `assembly-hatch-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className="company-assembly"
      viewBox="0 0 720 420"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern
          id={hatch}
          patternUnits="userSpaceOnUse"
          width="5.2"
          height="5.2"
          patternTransform="rotate(30)"
        >
          <path d="M0,0V5.2" stroke="#88a3b1" strokeWidth="0.55" />
        </pattern>
      </defs>
      <g transform="translate(351 280) scale(1.08)">
        <ellipse
          cx="7"
          cy="50"
          rx="245"
          ry="58"
          fill="#8c8370"
          opacity="0.055"
        />
        <ellipse
          cx="12"
          cy="49"
          rx="200"
          ry="38"
          fill="#8c8370"
          opacity="0.065"
        />
        {(
          [
            [-138, -60],
            [140, -60],
            [-138, 60],
            [140, 60],
          ] as const
        ).map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <Puck x={x} y={y} z={-12} r={10} h={5} material={steel} />
            <Puck x={x} y={y} z={-7} r={6} h={8} material={stone} />
          </g>
        ))}
        <Block x={-168} y={-75} z={0} w={338} d={150} h={10} material={stone} />
        <polygon
          points={points([
            [-161, -68, 10.2],
            [163, -68, 10.2],
            [163, 68, 10.2],
            [-161, 68, 10.2],
          ])}
          fill="none"
          stroke="#a99f8b"
          strokeWidth="0.65"
        />
        {(
          [
            [-159, -66],
            [161, -66],
            [-159, 66],
            [161, 66],
          ] as const
        ).map(([x, y]) => (
          <Screw key={`${x}-${y}`} at={[x, y, 10.4]} r={2.2} />
        ))}
        <Rail y={-44} />
        <Block x={-151} y={-3} z={13} w={306} d={6} h={4} material={brass} />
        <g stroke="#765d39" strokeWidth="0.7">
          {Array.from({ length: 51 }, (_, i) => (
            <path
              key={i}
              d={line([-147 + i * 5.8, -3, 17], [-143.5 + i * 5.8, 3, 17])}
            />
          ))}
        </g>
        <Rail y={44} />
        <Block x={-159} y={-7} z={10} w={11} d={14} h={13} material={steel} />
        <Block x={151} y={-8} z={10} w={15} d={16} h={15} material={steel} />
        <Screw at={[-154, 0, 23]} r={1.8} />
        <RegistrationPlate x={-111} stage={0} />
        <RegistrationPlate x={-23} stage={1} />
        <RegistrationPlate x={65} stage={2} />
        <AxialCell
          x={70}
          z={84.4}
          radius={43}
          depth={13}
          hollow={29.5}
          material={blue}
        />
        <g transform={frontPlane(83.2, 0, 84.4)}>
          <path d={annulus(42.5, 35.5)} fill={`url(#${hatch})`} />
          <circle r="35.2" fill="none" stroke="#a0b0b0" strokeWidth="0.7" />
          <circle r="29.2" fill="#d9e4df" stroke={ink} strokeWidth="0.8" />
          <circle r="26.2" fill="#edf1e8" stroke="#a1b8b4" strokeWidth="0.65" />
          <path
            d="M-17,15A23,23 0 0 0 7,22"
            fill="none"
            stroke="#fffdf4"
            strokeWidth="2.2"
          />
          <path
            d="M-18,-14A23,23 0 0 1 4,-23"
            fill="none"
            stroke="#b1c4c1"
            strokeWidth="0.65"
          />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r = i % 3 === 0 ? 38 : 39.5;
            return (
              <path
                key={i}
                d={`M${Math.cos(a) * r},${Math.sin(a) * r}L${Math.cos(a) * 41.2},${Math.sin(a) * 41.2}`}
                stroke="#c4d1d0"
                strokeWidth="0.7"
              />
            );
          })}
        </g>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2 + 0.2;
          return (
            <Screw
              key={i}
              at={[83.5, Math.cos(a) * 32.5, 84.4 + Math.sin(a) * 32.5]}
              plane="front"
              r={1.45}
            />
          );
        })}
        <AxialCell x={165} z={17} radius={4.2} depth={10} material={brass} />
        <AxialCell x={174} z={17} radius={10.5} depth={19} material={brass} />
        <g stroke="#7f663e" strokeWidth="0.65">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (-0.2 + (i / 12) * 0.9) * Math.PI;
            return (
              <path
                key={i}
                d={line(
                  [175, Math.cos(a) * 10.6, 17 + Math.sin(a) * 10.6],
                  [192, Math.cos(a) * 10.6, 17 + Math.sin(a) * 10.6],
                )}
              />
            );
          })}
        </g>
        <circle
          transform={frontPlane(193.2, 0, 17)}
          r="6.9"
          fill="none"
          stroke="#7f663e"
          strokeWidth="0.7"
        />
        <path
          transform={frontPlane(193.3, 0, 17)}
          d="M0,0V7"
          stroke={ink}
          strokeWidth="0.9"
        />
        <Block
          x={-131}
          y={59}
          z={10.4}
          w={247}
          d={6.5}
          h={0.7}
          material={steel}
        />
        <g stroke={ink} strokeWidth="0.6">
          {Array.from({ length: 49 }, (_, i) => (
            <path
              key={i}
              d={line(
                [-127 + i * 4.9, 65.5, 11.1],
                [-127 + i * 4.9, i % 4 === 0 ? 60 : 62.5, 11.1],
              )}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}

function FintechStudy() {
  return (
    <g>
      <Block x={-52} y={-30} z={0} w={104} d={60} h={5} material={stone} />
      <Block x={-43} y={-17} z={5} w={86} d={8} h={6} material={steel} />
      <Block x={-43} y={10} z={5} w={86} d={8} h={6} material={steel} />
      <Block x={-23} y={-9} z={11} w={46} d={18} h={5} material={paper} />
      <path
        d={line([-20, -5, 16], [20, -5, 16])}
        stroke="#a99f8b"
        strokeWidth="0.6"
      />
      <path
        d={line([-20, 5, 16], [20, 5, 16])}
        stroke="#a99f8b"
        strokeWidth="0.6"
      />
      <Puck x={-28} y={0} z={11} r={20} h={7} material={brass} />
      <g
        transform={topPlane(-28, 0, 18)}
        stroke="#876f48"
        fill="none"
        strokeWidth="0.85"
      >
        <circle r="15" />
        <path d="M-6,-8V8H6M-6,0H3" />
      </g>
      <Puck x={28} y={0} z={11} r={20} h={7} material={blue} />
      <g
        transform={topPlane(28, 0, 18)}
        stroke="#ccd8d4"
        fill="none"
        strokeWidth="0.85"
      >
        <circle r="15" />
        <path d="M-5,-8H5V8H-5ZM-9,0H-5M5,0H9" />
      </g>
      {[-44, 44].map((x) => (
        <Screw key={x} at={[x, 24, 5]} r={1.6} />
      ))}
    </g>
  );
}

function BankingStudy() {
  return (
    <g>
      <Block x={-52} y={-27} z={0} w={104} d={54} h={5} material={stone} />
      <Block x={-46} y={-22} z={5} w={92} d={44} h={5} material={paper} />
      {[-29, 0, 29].map((x) => (
        <g key={x}>
          <Block
            x={x - 10}
            y={-14}
            z={10}
            w={20}
            d={28}
            h={5}
            material={stone}
          />
          <Block
            x={x - 7}
            y={-11}
            z={15}
            w={14}
            d={22}
            h={36}
            material={paper}
          />
          <path
            d={`${line([x - 2.8, 11.1, 15], [x - 2.8, 11.1, 51])}${line([x + 2.8, 11.1, 15], [x + 2.8, 11.1, 51])}`}
            stroke="#bdb7a5"
            strokeWidth="0.6"
          />
          <Block
            x={x - 10}
            y={-14}
            z={51}
            w={20}
            d={28}
            h={5}
            material={stone}
          />
        </g>
      ))}
      <Block x={-47} y={-19} z={56} w={94} d={38} h={8} material={paper} />
      <Block x={-48} y={-20} z={64} w={96} d={40} h={2} material={brass} />
      <path
        d={line([-47, 19, 60], [47, 19, 60])}
        stroke="#b9b19d"
        strokeWidth="0.65"
      />
    </g>
  );
}

function TechnologyStudy({ hatch }: { hatch: string }) {
  return (
    <g>
      <Block x={-51} y={-34} z={0} w={102} d={68} h={5} material={stone} />
      <polygon
        points={points([
          [-46, -29, 5.1],
          [46, -29, 5.1],
          [46, 29, 5.1],
          [-46, 29, 5.1],
        ])}
        fill="#e0e4d8"
        stroke={ink}
        strokeWidth="0.6"
      />
      {[-1, 1].flatMap((direction) =>
        [-17, -8.5, 0, 8.5, 17].map((y) => (
          <Block
            key={`${direction}-${y}`}
            x={direction === 1 ? 21 : -34}
            y={y - 2}
            z={5.2}
            w={13}
            d={4}
            h={2.2}
            material={brass}
          />
        )),
      )}
      {[-1, 1].flatMap((direction) =>
        [-15, -5, 5, 15].map((x) => (
          <Block
            key={`${direction}-${x}`}
            x={x - 2}
            y={direction === 1 ? 20 : -29}
            z={5.2}
            w={4}
            d={9}
            h={2.2}
            material={brass}
          />
        )),
      )}
      <Block x={-25} y={-23} z={5.2} w={50} d={46} h={6} material={paper} />
      <Block x={-20} y={-18} z={11.2} w={40} d={36} h={5.5} material={blue} />
      <g transform={topPlane(0, 0, 16.8)}>
        <rect
          x="-17"
          y="-15"
          width="34"
          height="30"
          fill={`url(#${hatch})`}
          stroke="#acc0c3"
          strokeWidth="0.6"
        />
        <rect
          x="-9"
          y="-8"
          width="18"
          height="16"
          fill="#315b73"
          stroke="#a1b8bc"
          strokeWidth="0.6"
        />
        <path
          d="M-17,0H-9M9,0H17M0,-15V-8M0,8V15"
          stroke="#a1b8bc"
          strokeWidth="0.6"
        />
      </g>
      {(
        [
          [-42, -25],
          [42, -25],
          [-42, 25],
          [42, 25],
        ] as const
      ).map(([x, y]) => (
        <Screw key={`${x}-${y}`} at={[x, y, 5.3]} r={1.9} />
      ))}
    </g>
  );
}

export function SectorStudy({
  kind,
}: {
  kind: 'fintech' | 'banking' | 'technology';
}) {
  const hatch = `sector-hatch-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className="company-sector-study"
      viewBox="0 0 180 130"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={hatch} patternUnits="userSpaceOnUse" width="4" height="4">
          <path d="M0,0V4" stroke="#8faab5" strokeWidth="0.5" />
        </pattern>
      </defs>
      <g transform={`translate(90 ${kind === 'banking' ? 94 : 76})`}>
        <ellipse
          cx="0"
          cy="16"
          rx="72"
          ry="24"
          fill="#7a715d"
          opacity="0.055"
        />
        {kind === 'fintech' ? (
          <FintechStudy />
        ) : kind === 'banking' ? (
          <BankingStudy />
        ) : (
          <TechnologyStudy hatch={hatch} />
        )}
      </g>
    </svg>
  );
}
