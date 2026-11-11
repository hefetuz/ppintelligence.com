const {
  Cam, circ, clamp, disposer, facing, fillet, fit, mk, open, pointer, poly,
  prism, proj, put, rad, register, seg, solid, spring, stepS, unproj,
} = HL;

const LEAVES = 7, REST = 0, HIT = 66, TOP = 8;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 2.08);
  fit(C, [[-72, -72, -8], [72, 72, -8], [-72, 72, 14], [72, -72, 14]], 200, 166);
  const P = proj(C), front = facing(C), root = mk("g", {}, svg);
  let maxTurn = clamp(value, 32, 60), active = false, activeLeaf = 0;
  let proximity = REST, drawn = NaN, drawnTurn = NaN;
  const aperture = spring(REST, { k: 100, c: 18, m: 1, eps: 0.002 });

  // A stepped circular housing makes the closed mechanism a composed desk object.
  const base = solid(root), recess = solid(root);
  put(base, prism(P, front, circ(70, 64), circ(67, 64), -8, -1));
  put(recess, prism(P, front, circ(60, 64), circ(57, 64), -1, 4));
  base.sil.classList.add("hi");

  // The penny is genuinely behind the leaves; their ordinary filled paths occlude it.
  const coin = solid(root);
  put(coin, prism(P, front, circ(24, 56), circ(20.5, 56), 4, 7));
  const mint = mk("path", { class: "nf lo" }, root);
  mint.setAttribute("d", poly(circ(17, 48).map(p => P(p.u, p.v, 7.1))) + Array.from({ length: 18 }, (_, i) => {
    const a = rad(i * 20);
    return seg(P(Math.cos(a) * 21, Math.sin(a) * 21, 7.1), P(Math.cos(a) * 23, Math.sin(a) * 23, 7.1));
  }).join(""));

  // Each vane rotates around its own fixed pin, like a real diaphragm.
  const leaves = [];
  for (let i = 0; i < LEAVES; i++) {
    const a = i * 360 / LEAVES, ar = rad(a), ca = Math.cos(ar), sa = Math.sin(ar);
    const px = ca * 40, py = sa * 40;
    leaves.push({ a, px, py, el: solid(root) });
  }
  for (const leaf of leaves) {
    const { px, py } = leaf;
    const pin = solid(root), shift = ring => ring.map(s => ({ ...s, u: s.u + px, v: s.v + py }));
    put(pin, prism(P, front, shift(circ(3.2, 20)), shift(circ(2.2, 20)), TOP + 1.8, TOP + 4));
  }

  function leafPoints(leaf, q) {
    const turn = rad(leaf.a + 4 + q * maxTurn), ct = Math.cos(turn), st = Math.sin(turn);
    const shape = [[-39,-6],[-25,-17],[5,-18],[12,-7],[7,8],[-26,11]];
    return fillet(shape, [5,7,7,6,7,6], 4).map(([x, y]) => {
      const dx = x, dy = y;
      return [leaf.px + dx * ct - dy * st, leaf.py + dx * st + dy * ct];
    });
  }

  function draw() {
    const q = clamp(aperture.x, 0, 1);
    if (q === drawn && maxTurn === drawnTurn) return;
    drawn = q; drawnTurn = maxTurn;
    leaves.forEach((leaf, i) => {
      const z = TOP + i * 0.22, points = leafPoints(leaf, q);
      put(leaf.el, {
        sil: poly(points.map(([x, y]) => P(x, y, z))),
        crease: open(points.slice(2, 5).map(([x, y]) => P(x, y, z + 0.35))),
      });
    });
    accent();
  }

  function accent() {
    const exposed = active && drawn > 0.65;
    base.sil.classList.toggle("hi", !active);
    coin.sil.classList.toggle("hi", exposed);
    leaves.forEach((leaf, i) => leaf.el.sil.classList.toggle("hi", active && !exposed && i === activeLeaf));
  }

  draw();
  read.textContent = "rest";
  const loop = register(stage, dt => {
    const moving = stepS(aperture, dt);
    draw();
    return moving;
  });
  bag.add(loop.unregister);

  function release() {
    active = false;
    proximity = REST;
    aperture.t = REST;
    read.textContent = "rest";
    accent();
    loop.wake();
  }
  function aim(point) {
    // Hit-testing stays on the fixed top plane of the housing, never on a moving leaf.
    const [x, y] = unproj(C, point[0], point[1], TOP);
    const distance = Math.hypot(x, y);
    if (distance > HIT) return release();
    active = true;
    proximity = clamp(1 - distance / HIT, 0, 1);
    aperture.t = proximity;
    if (distance > 1) {
      const angle = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      activeLeaf = Math.round(angle / (360 / LEAVES)) % LEAVES;
    }
    read.textContent = `open ${Math.round(proximity * maxTurn)}°`;
    accent();
    loop.wake();
  }
  bag.add(pointer(stage, { move: aim, down: aim, leave: release }));
  bag.add(() => svg.replaceChildren());

  return {
    set: next => {
      maxTurn = clamp(next, 32, 60);
      aperture.t = proximity;
      drawnTurn = NaN;
      draw();
      if (active) read.textContent = `open ${Math.round(proximity * maxTurn)}°`;
      loop.wake();
    },
    destroy: bag.dispose,
  };
}

hairline({
  name: "value-iris",
  means: "A mechanical diaphragm opens toward the pointer to reveal a penny of value beneath its leaves.",
  rules: [1, 3, 4, 5, 6, 7, 8, 9, 10],
  range: [32, 48, 60],
  mount,
});
