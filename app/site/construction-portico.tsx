import { assetUrl } from '../asset-url';
/** The page grid is the building's front plane; one camera projects the recess. */
const eye = [648, 250];
const project = ([x, y]: number[], t: number) => [eye[0] + (x - eye[0]) * t, eye[1] + (y - eye[1]) * t];
const segment = (a: number[], b: number[]) => `M${a.join(' ')}L${b.join(' ')}`;
// 5.8256% front inset and 71.6% rear opening follow the Replay reference proportions.
const front = [[75,58],[1221,58],[1221,442],[75,442]];
const rear = front.map(p => project(p,.81));
const spiral = (cx:number,cy:number,mirror=1) => Array.from({length:72},(_,i)=>{
 const a=i/71*Math.PI*3.4,r=5.5*(1-i/82);
 return `${i?'L':'M'}${cx+mirror*r*Math.cos(a)} ${cy+r*Math.sin(a)}`;
}).join('');

export function ConstructionPortico() {
 return <svg className="decision-room__technical" viewBox="0 -140 1296 770" fill="none" aria-hidden="true" focusable="false">
  <defs>
   <clipPath id="construction-air"><path d="M0 -140H1296V-25L648 -112L0 -25Z" /></clipPath>
   <clipPath id="construction-ground"><path d="M75 491H1221V600H75Z" /></clipPath>
   <clipPath id="portico-ceiling"><path d="M75 58H1221L1112.13 94.48H183.87Z" /></clipPath>
   <clipPath id="portico-sill"><path d="M75 442H1221L1112.13 405.52H183.87Z" /></clipPath>
   <clipPath id="portico-wall-left"><path d="M75 58L183.87 94.48V405.52L75 442Z" /></clipPath>
   <clipPath id="portico-wall-right"><path d="M1221 58L1112.13 94.48V405.52L1221 442Z" /></clipPath>
  </defs>
  <g className="portico-textures">
   <g clipPath="url(#portico-ceiling)">
    <image className="portico-texture-cap" href={assetUrl('assets/company/replay-reference/5aa99090aa55e61f-1280.webp')} x="75" y="58" width="1146" height="36.48" preserveAspectRatio="none" transform="translate(0 152.48) scale(1 -1)" />
   </g>
   <g clipPath="url(#portico-sill)">
    <image className="portico-texture-cap" href={assetUrl('assets/company/replay-reference/5aa99090aa55e61f-1280.webp')} x="75" y="405.52" width="1146" height="36.48" preserveAspectRatio="none" />
   </g>
   <g clipPath="url(#portico-wall-left)">
    <image className="portico-texture-side" href={assetUrl('assets/company/replay-reference/066bc2b2bc995bec-128.webp')} x="75" y="58" width="108.87" height="384" preserveAspectRatio="none" transform="translate(258.87 0) scale(-1 1)" />
   </g>
   <g clipPath="url(#portico-wall-right)">
    <image className="portico-texture-side" href={assetUrl('assets/company/replay-reference/066bc2b2bc995bec-128.webp')} x="1112.13" y="58" width="108.87" height="384" preserveAspectRatio="none" />
   </g>
  </g>
  <g className="portico-rays" clipPath="url(#construction-air)">
   {[110,285,460,836,1011,1186].map(x=><path key={x} d={segment([x,-25],project([x,-25],2.3))} />)}
  </g>
  <g className="portico-rays" clipPath="url(#construction-ground)">
   {[184,340,495,801,956,1112].map(x=><path key={x} d={segment([x,490],project([x,490],1.6))} />)}
  </g>
  <g className="portico-datums">
   <path d="M0 -25H1296M0 58H1296M0 442H1296M0 490H1296M648 -140V-113" />
   <path d="M75 -140V-36M1221 -140V-36" />
  </g>
  <g className="portico-outline">
   <path d="M0 -25L648 -112L1296 -25L1288 -18H8Z" />
   <path className="portico-detail" d="M14 -26L648 -104L1282 -26" />
   <path d="M8 -10H1288V-4H8ZM12 4H1284V10H12ZM15 19H1281V47H15Z" />
   <path d="M75 58H1221V442H75Z" />
   <path d={`M${rear[0].join(' ')}H${rear[1][0]}V${rear[2][1]}H${rear[0][0]}Z`} />
   {front.map((p,i)=><path key={i} d={segment(p,rear[i])} />)}
   {[25,56,1240,1271].map(x=><g key={x}>
    <path d={`M${x-13} 440h26v8h-26ZM${x-10} 433h20v5h-20ZM${x-7.5} 84L${x-9} 430Q${x} 434 ${x+9} 430L${x+7.5} 84M${x-10} 78h20v4h-20ZM${x-14} 51h28v4h-28Z`} />
    <path d={`M${x-12} 61Q${x} 57 ${x+12} 61M${x-8} 75Q${x} 78 ${x+8} 75`} />
    <path d={spiral(x-8,67)+spiral(x+8,67,-1)} />
    <g className="portico-detail">{[-5,-2.5,0,2.5,5].map(dx=><path key={dx} d={segment([x+dx*.85,86],[x+dx,429])} />)}</g>
   </g>)}
   <path d="M15 448H1281L1287 457H9ZM9 457V462H1287V457M9 462L1291 472H5ZM5 472V477H1291V472M5 477L1296 486H0ZM0 486V490H1296V486" />
  </g>
  <g className="portico-registration">
   {[0,1296].flatMap(x=>[-25,58,442,490].map(y=><path key={`${x}-${y}`} d={`M${x-5} ${y}h10M${x} ${y-5}v10`} />))}
  </g>
 </svg>;
}
