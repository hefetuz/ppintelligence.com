// Generated from the authored reference by scripts/coin-systems-v2/bake-parts.mjs.
export const AZIMUTH = 45;
export const ELEVATION = 30;
export const SHADES = 4;
const RADIANS = Math.PI / 180;
const UNIT = Math.sqrt(1.6);
const cameraCache=new WeakMap();
export function cameraOf(projection) {
    if(cameraCache.has(projection))return cameraCache.get(projection);
    const {scale,azimuth=AZIMUTH,elevation=ELEVATION}=projection;
    const a = azimuth * RADIANS;
    const e = elevation * RADIANS;
    const camera={ sinA: Math.sin(a), cosA: Math.cos(a), sinE: Math.sin(e), cosE: Math.cos(e), k: scale * UNIT };cameraCache.set(projection,camera);return camera;
}
export function iso([x, y, z], projection) {
    const { origin } = projection;
    const { sinA, cosA, sinE, cosE, k } = cameraOf(projection);
    return [origin[0] + (x * sinA - y * cosA) * k, origin[1] + ((x * cosA + y * sinA) * sinE - z * cosE) * k];
}
export function towardViewer(projection) {
    const { sinA, cosA } = cameraOf(projection);
    return [cosA, sinA];
}
export function depthOf([x, y, z], projection) {
    const { sinA, cosA, sinE, cosE } = cameraOf(projection);
    return (x * cosA + y * sinA) * cosE + z * sinE;
}
const tenth=value=>String(Math.round(value*10)/10);
export function pathOf(points, closed = false) {
    if (!points.length)
        return "";
    return points.map(([x, y], at) => `${at ? "L" : "M"}${tenth(x)} ${tenth(y)}`).join("") + (closed ? "Z" : "");
}
export const joinPaths = (paths) => paths.filter(Boolean).join("");

export function circleRing(cx, cy, radius, steps = 40) {
    return Array.from({ length: steps }, (_, step) => {
        const angle = (step / steps) * Math.PI * 2;
        return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
    });
}

export function onTop(points, z, projection, closed = false) {
    return pathOf(points.map(([x, y]) => iso([x, y, z], projection)), closed);
}

export const lineOnTop=(from,to,z,P)=>onTop([from,to],z,P);
export const ring=(cx,cy,r,z,P,steps=40)=>onTop(circleRing(cx,cy,r,steps),z,P,true);
export const coinSystems={"strategy":{stateAt:function (time) {
    const t = ((time % 12) + 12) % 12;
    const journey = t < 6 ? 1 : 2, sign = journey === 1 ? 1 : -1;
    const local = t % 6, phase = Math.min(11, Math.floor(local * 2));
    // radius, carrier angle, outer angle, middle angle, inner angle.
    // Transfers freeze both adjacent ports; turns carry the shuttle on a circular lane.
    const poses = [
      [94,0,0,0,0], [94,.7,.7,.7,-.8], [64,.7,.7,.7,-1.4],
      [64,-.8,1.4,-.8,-.8], [34,-.8,2,-.8,-.8],
      [34,.5,-.4,.5,.5], [0,.5,-.4,1.3,.5], [34,.5,-1,-1,.5],
      [34,-1,-1,-1,-1], [64,-1,.4,-1,-1], [64,.4,.4,.4,0],
      [94,.4,.4,.4,-.6], [94,0,0,0,0]
    ];
    const u = local * 2 - phase, e = u * u * (3 - 2 * u);
    const p = poses[phase].map((v,i) => v + (poses[phase+1][i]-v)*e);
    const angle = sign*p[1], radius=p[0];
    return { t, journey, phase, radius, angle, angles:p.slice(2).map(v=>v*sign),
      x:radius*Math.cos(angle), y:radius*Math.sin(angle),
      inbound:local<3, docked:radius<1.5 };
  },animate:function (_svg, state, api) {
    const { k, P } = api, TAU = Math.PI*2;
    const path = (pts,closed=true) => k.pathOf(pts.map(p=>k.iso(p,P)),closed);
    const polar = (r,a,z=4) => [r*Math.cos(a),r*Math.sin(a),z];
    const arc = (r,a,b,n=64) => Array.from({length:n+1},(_,j)=>polar(r,a+(b-a)*j/n));
    const sector = (ri,ro,a,b) => path([...arc(ro,a,b,8),...arc(ri,b,a,8)]);
    for(let i=0;i<3;i++) {
      const ri=[80,50,22][i], ro=[108,78,48][i], lane=[94,64,34][i], a=state.angles[i];
      // A closed circular guide and one open-to-edge radial transfer slot per rotor.
      let routes=k.ring(0,0,lane-2,4,P,128)+k.ring(0,0,lane+2,4,P,128);
      const c=Math.cos(a),sn=Math.sin(a);
      const point=(r,v)=>[r*c-v*sn,r*sn+v*c,4];
      routes+=path([point(ri,-2),point(ro,-2),point(ro,2),point(ri,2)]);
      api.path('strategy.route.'+i,routes);
      let shoulders=k.ring(0,0,ri+1,4,P,128)+k.ring(0,0,ro-1,4,P,128), ticks='', sockets='';
      for(let j=0;j<48;j++) {
        const b=a+j*TAU/48;
        ticks+=path([polar(ro-1,b),polar(ro-(j%4===0?4:2.7),b)],false);
      }
      for(let j=1;j<12;j++) {
        const b=a+j*TAU/12;
        shoulders+=sector(ri+3,lane-5,b-.14,b+.14);
        const q=polar(ro-5.5,b);
        sockets+=k.ring(q[0],q[1],.85,4,P,16);
        sockets+=path([[q[0]-.85*c,q[1]-.85*sn,4],[q[0]+.85*c,q[1]+.85*sn,4]],false);
      }
      // Distinct double index attached to the actual rotating outer shoulder.
      ticks+=path([polar(ro-1,a-.025),polar(ro-6,a-.025),polar(ro-6,a+.025),polar(ro-1,a+.025)]);
      api.path('strategy.shoulders.'+i,shoulders);
      api.path('strategy.ticks.'+i,ticks);
      api.path('strategy.sockets.'+i,sockets);
    }
    for(const id of ['strategy.carrier.foot','strategy.carrier.body','strategy.carrier.cap'])api.move(id,[state.x-94,state.y,0]);
  }},
"risk":{stateAt:function stateAt(t) {
    const period = 12, local = ((t % period) + period) % period;
    const smooth = x => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
    const loads = [0, 1, 2].map(index => {
      const q = local - index * 4;
      if (q < 0 || q >= 4 || q < 0.45) return 0;
      if (q < 1.65) return smooth((q - 0.45) / 1.2);
      if (q < 2.35) return 1;
      if (q < 3.55) return 1 - smooth((q - 2.35) / 1.2);
      return 0;
    });
    let active = -1;
    for (let i = 0; i < 3; i += 1) if (loads[i] > 0.001) active = i;
    const peak = Math.max(...loads);
    return {phase: local / period, active, peak, loads, loadStroke: loads.map(value => 5 * value), deflection: loads.map(value => 2.2 * value), clearance: 3.8 * (1 - peak), balance: peak * 100, shares: {}};
  },animate:function animate(svg, state, api) {
    const angles = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6];
    for (let i = 0; i < 3; i += 1) {
      const n = i + 1, ux = Math.cos(angles[i]), uy = Math.sin(angles[i]);
      api.move(`risk-member-${n}`, [-state.deflection[i] * ux, -state.deflection[i] * uy, 0]);
      api.move(`risk-load-carriage-${n}`, [-state.loadStroke[i] * ux, -state.loadStroke[i] * uy, 0]);
      const points = [], outer = 12.5 - state.deflection[i];
      for (let step = 0; step <= 14; step += 1) {
        const u = step / 14, radius = 9.3 + (outer - 9.3) * u;
        const side = step === 0 || step === 14 ? 0 : (step % 2 ? 1.35 : -1.35);
        points.push(api.k.iso([radius * ux - side * uy, radius * uy + side * ux, 9.1], api.P));
      }
      api.path(`risk-compliance-${n}`, api.k.pathOf(points));
      const gaugeAngle = angles[i] + Math.PI / 3;
      const gaugeX = 85 * Math.cos(gaugeAngle), gaugeY = 85 * Math.sin(gaugeAngle);
      const needleAngle = gaugeAngle - 1.15 + 2.3 * state.loads[i];
      api.path(`risk-gauge-needle-${n}`, api.k.lineOnTop(
        [gaugeX + 1.6 * Math.cos(needleAngle), gaugeY + 1.6 * Math.sin(needleAngle)],
        [gaugeX + 9.2 * Math.cos(needleAngle), gaugeY + 9.2 * Math.sin(needleAngle)],
        10.45,
        api.P
      ));
    }
  }},
"analysis":{stateAt:function stateAt(seconds){
  const phase=((seconds%12)+12)%12/12,t=phase*Math.PI*2;
  const inputs=[.9*Math.sin(t),.7*(Math.sin(2*t+.6)-Math.sin(.6)),.85*(Math.sin(t-.8)+Math.sin(.8))];
  const first=(9*inputs[0]+23*inputs[1])/32,output=(9*first+23*inputs[2])/32;
  return {phase,inputs,carriers:[first,output],output};
 },animate:function animate(_svg,state,api){
  const {k,P}=api,T=Math.PI*2;
  const line=(pts)=>k.pathOf(pts.map(p=>k.iso(p,P)));
  const mark=(x,y,r,z,a,n)=>{
   let d=k.ring(x,y,r,z,P,64);for(let j=0;j<n;j++){
    const b=a+j*T/n;
    d+=line([[x+(r-2)*Math.cos(b),y+(r-2)*Math.sin(b),z],[x+r*Math.cos(b),y+r*Math.sin(b),z]]);
   }return d;
  };
  for(let i=0;i<3;i++){
   const a=-Math.PI/2+i*T/3;
   api.path(`economics.input.${i}.index`,mark(79*Math.cos(a),79*Math.sin(a),15,9,state.inputs[i],12));
  }
  for(let stage=0;stage<2;stage++){
   const z=7+stage*12,c=state.carriers[stage],sun=stage===0?state.inputs[0]:state.carriers[0],ring=state.inputs[stage===0?1:2];
   api.path(`economics.stage.${stage}.sun-index`,mark(0,0,8.6,z+4,sun,9));
   api.path(`economics.stage.${stage}.ring-index`,mark(0,0,28,z+4,ring,23));
   for(let j=0;j<3;j++){
    const a=j*T/3,x=16*Math.cos(a),y=16*Math.sin(a),delta=[16*Math.cos(a+c)-x,16*Math.sin(a+c)-y,0];
    for(const part of ['gear','pin'])api.move(`economics.stage.${stage}.planet.${j}.${part}`,delta);
    api.path(`economics.stage.${stage}.planet.${j}.index`,mark(x,y,6.6,z+4,c-9/7*(sun-c),7));
   }
  }
  const a=-Math.PI/2+state.output;
  api.path('economics.output.needle',line([[2*Math.cos(a),78+2*Math.sin(a),9.3],[16*Math.cos(a),78+16*Math.sin(a),9.3]]));
 }}};
export const period=12;
