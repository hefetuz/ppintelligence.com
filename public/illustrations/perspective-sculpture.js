const {
  Cam, clamp, disposer, facing, fit, mk, open, pointer, poly, prism,
  proj, put, rad, register, rings, solid, spring, stepS,
} = HL;

// Three fixed tubular arcs, separated along the answer camera's sight line.
// Only the camera moves. At 45 degrees their projections form one exact circle.
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const unit = a => a.map(v => v / Math.hypot(...a));
const add = (a, b, t = 1) => a.map((v, i) => v + b[i] * t);

function mount({ stage, svg, read }, value) {
  const bag = disposer(), root = mk("g", {}, svg);
  const reference = proj(Cam(45, .5, 1)), origin = reference(0, 0, 0);
  const basis = [[1,0,0], [0,1,0], [0,0,1]].map(p => reference(...p));
  const U = unit(basis.map(p => p[0] - origin[0]));
  const V = unit(basis.map(p => origin[1] - p[1]));
  let N = unit(cross(U, V));
  if (N[2] < 0) N = N.map(v => -v);
  const centre = [0, 0, 74], radius = 46, tube = 3.2;
  const arcs = [-30, 0, 30].map((depth, i) => ({
    depth, start: rad([-150, -270, -90][i]),
    el: mk("g", {}, root), body: null, crease: null, foot: null, stem: null,
  }));
  const base = solid(root);
  arcs.forEach(a => {
    a.foot = solid(a.el); a.stem = solid(a.el);
    a.body = mk("path", { class: "sil" }, a.el);
    a.crease = mk("path", { class: "nf lo" }, a.el);
  });
  const angle = spring(45 - value);
  let reach = value, over = null, drawn = NaN;
  const radial = t => add(U.map(v => v * Math.cos(t)), V, Math.sin(t));
  const point = (a, t) => add(add(centre, N, a.depth), radial(t), radius);
  // Fit fixed physical bounds, not a moving hit area or independently animated parts.
  const bounds = [[-56,-56,-6], [56,56,-6], [-56,56,-6], [56,-56,-6]];
  arcs.forEach(a => {
    for (let i = 0; i <= 48; i++) bounds.push(point(a, a.start + i * Math.PI / 36));
  });

  function draw() {
    if (drawn === angle.x) return;
    drawn = angle.x;
    const C = Cam(angle.x, .5, 1.6);
    fit(C, bounds, 200, 166);
    const P = proj(C), front = facing(C), p0 = P(0,0,0);
    const projectVector = v => { const p = P(...v); return [p[0]-p0[0], p[1]-p0[1]]; };
    const pn = projectVector(N);
    const [br, bi] = rings(-56,-56,56,56,9,1.8);
    put(base, prism(P, front, br, bi, -6, 0));
    root.appendChild(base.g);
    // Whole arcs have distinct, fixed depths; sort against the current sight ray.
    const bx = [[1,0,0],[0,1,0],[0,0,1]].map(projectVector);
    let view = unit(cross(bx.map(p => p[0]), bx.map(p => p[1])));
    if (view[2] < 0) view = view.map(v => -v);
    [...arcs].sort((a,b) => dot(add(centre,N,a.depth),view)-dot(add(centre,N,b.depth),view)).forEach(a => {
      root.appendChild(a.el);
      const anchor = point(a, -Math.PI / 2), x = anchor[0], y = anchor[1];
      const [fr, fi] = rings(x-6,y-6,x+6,y+6,3,1);
      const [sr, si] = rings(x-1.5,y-1.5,x+1.5,y+1.5,1.1,.5);
      put(a.foot, prism(P,front,fr,fi,0,2));
      put(a.stem, prism(P,front,sr,si,2,anchor[2]-tube));
      const left = [], right = [], line = [];
      let firstAlpha = 0, lastAlpha = 0;
      const end = a.start + Math.PI * 4 / 3;
      for (let i = 0; i <= 64; i++) {
        const t = a.start + (end-a.start)*i/64, r = radial(t), c = point(a,t);
        const tangent = projectVector(add(U.map(v => -v*Math.sin(t)), V, Math.cos(t)));
        const normal = unit([-tangent[1],tangent[0]]), pr = projectVector(r);
        const alpha = Math.atan2(dot(normal,pn), dot(normal,pr));
        const offset = add(r.map(v => v*Math.cos(alpha)),N,Math.sin(alpha));
        left.push(P(...add(c,offset,tube))); right.push(P(...add(c,offset,-tube)));
        line.push(P(...add(c,N,tube)));
        if (!i) firstAlpha = alpha;
        if (i === 64) lastAlpha = alpha;
      }
      const cap = (t, alpha, sign) => {
        const r = radial(t), c = point(a,t), points = [];
        for (let i=1;i<12;i++) {
          const v = alpha + sign*Math.PI*i/12;
          points.push(P(...add(c,add(r.map(n=>n*Math.cos(v)),N,Math.sin(v)),tube)));
        }
        return points;
      };
      a.body.setAttribute("d", poly([...left,...cap(end,lastAlpha,1),...right.reverse(),...cap(a.start,firstAlpha+Math.PI,1)]));
      a.crease.setAttribute("d", open(line));
      a.body.classList.toggle("hi", a === arcs[2]);
    });
  }

  draw();
  const loop = register(stage, dt => { const moving = stepS(angle,dt); draw(); return moving; });
  bag.add(loop.unregister);
  function aim(p) {
    over = p;
    if (!p || p[0]<45 || p[0]>355 || p[1]<35 || p[1]>285) {
      over = null; angle.t = 45-reach; read.textContent = "rest";
    } else {
      angle.t = 45 + clamp((p[0]-200)/145,-1,1)*reach;
      read.textContent = Math.abs(angle.t-45)<1 ? "aligned" : `${Math.round(angle.t)}°`;
    }
    loop.wake();
  }
  read.textContent = "rest";
  bag.add(pointer(stage,{move:aim,down:aim,leave:()=>aim(null)}));
  bag.add(()=>svg.replaceChildren());
  return {
    set: next => { reach = clamp(next,28,54); aim(over); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "perspective-sculpture",
  means: "Three fixed metal arcs become one ring when the pointer finds a different viewing angle.",
  rules: [1,3,4,5,6,7,8,9,10],
  range: [28,42,54],
  mount,
});
