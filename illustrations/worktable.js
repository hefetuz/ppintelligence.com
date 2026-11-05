const {
  Cam, clamp, disposer, facing, fit, mk, pointer, prism, proj, put,
  rings, register, seg, solid, spring, stepS, unproj,
} = HL;

// A drafting table: four legs, a thick board, a loose pencil and three plans.
// One continuous gesture brings the offset plans onto a shared registration.
function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, 1.76);
  fit(C, [
    [-72,-49,59], [-72,49,59], [72,-49,59], [72,49,59],
    [-61,-39,-6], [-61,39,-6], [61,-39,-6], [61,39,-6],
  ], 200, 166);
  const P = proj(C), front = facing(C), root = mk('g', {}, svg);
  let reach = value, drawn = NaN, drawnReach = NaN, over = null;
  const alignment = spring(0);
  const block = (x0, y0, x1, y1, r, b, z0, z1) => {
    const [ring, inner] = rings(x0, y0, x1, y1, r, b);
    const el = solid(root);
    put(el, prism(P, front, ring, inner, z0, z1));
    return el;
  };

  // The far pair first, then the low stretchers, then the near pair.
  block(-61, -39, -53, -31, 2.5, 0.8, -6, 54);
  block(53, -39, 61, -31, 2.5, 0.8, -6, 54);
  block(-58, -35, -54, 35, 1.4, 0.7, 7, 11);
  block(54, -35, 58, 35, 1.4, 0.7, 7, 11);
  block(-58, 31, 58, 35, 1.4, 0.7, 7, 11);
  block(-61, 31, -53, 39, 2.5, 0.8, -6, 54);
  block(53, 31, 61, 39, 2.5, 0.8, -6, 54);
  block(-72, -49, 72, 49, 5, 1.8, 54, 59);

  // A pencil and its ferrule sit outside the moving sheets.
  block(-59, -35, -56, 22, 1.4, 0.5, 59, 61.8);
  block(-59, 16, -56, 22, 1.4, 0.5, 61.8, 62.2);
  const plans = [
    { x: -6, y: 5, z: 59.4, influence: 0.4 },
    { x: 5, y: -4, z: 60.4, influence: 0.7 },
    { x: 13, y: 9, z: 61.4, influence: 1 },
  ].map((plan, index) => {
    const el = solid(root);
    el.sil.classList.toggle('hi', index === 2);
    return { ...plan, el, frame: mk('path', { class: 'nf lo' }, root) };
  });

  function draw() {
    const q = alignment.x;
    if (q === drawn && reach === drawnReach) return;
    drawn = q; drawnReach = reach;
    for (const plan of plans) {
      const amount = clamp(q * reach, 0, 1) ** (1 / plan.influence);
      if (plan.drawnAmount === amount) continue;
      plan.drawnAmount = amount;
      const x = plan.x * (1 - amount), y = plan.y * (1 - amount);
      const [ring, inner] = rings(-40 + x, -26 + y, 40 + x, 26 + y, 1.8, 0.65);
      put(plan.el, prism(P, front, ring, inner, plan.z, plan.z + 0.65));
      // Four small registration corners, like a real blank drafting sheet.
      const marks = [];
      for (const [u, v, sx, sy] of [[-33,-19,1,1],[33,-19,-1,1],[-33,19,1,-1],[33,19,-1,-1]]) {
        marks.push(seg(P(u+x,v+y,plan.z+0.7),P(u+x+sx*5,v+y,plan.z+0.7)));
        marks.push(seg(P(u+x,v+y,plan.z+0.7),P(u+x,v+y+sy*5,plan.z+0.7)));
      }
      plan.frame.setAttribute('d', marks.join(''));
    }
  }
  draw();
  read.textContent = 'rest';
  const loop = register(stage, dt => {
    const moving = stepS(alignment, dt);
    draw();
    return moving;
  });
  bag.add(loop.unregister);
  function release() {
    over = null; alignment.t = 0; read.textContent = 'rest'; loop.wake();
  }
  function aim(point) {
    // The tabletop plane is fixed; no moving sheet participates in hit-testing.
    const [x, y] = unproj(C, point[0], point[1], 62);
    if (x < -65 || x > 65 || y < -43 || y > 43) return release();
    over = clamp((x + 45) / 90, 0, 1);
    alignment.t = over;
    read.textContent = over * reach >= 1 ? 'aligned' : 'aligning';
    loop.wake();
  }
  bag.add(pointer(stage, { move: aim, down: aim, leave: release }));
  bag.add(() => svg.replaceChildren());
  return {
    set: next => {
      reach = clamp(next, 0.7, 2.5);
      draw();
      if (over !== null) {
        read.textContent = over * reach >= 1 ? 'aligned' : 'aligning';
        loop.wake();
      }
    },
    destroy: bag.dispose,
  };
}

hairline({
  name: 'worktable',
  means: 'A shared drafting table brings three different plans into alignment under the pointer.',
  rules: [1, 3, 4, 5, 6, 7, 8, 9, 10],
  range: [0.7, 1.6, 2.5],
  mount,
});
