const {
  Cam, clamp, disposer, facing, fillet, fit, lerp, mk, pointer, prism, proj,
  put, rad, register, rings, solid, spring, stepS,
} = HL;

const UNIT = 22, OX = -98, OY = -44, Z0 = 1.5, Z1 = 8;
const REST_PACK = 0.08, HIT = [48, 352, 58, 280];

// These seven exact cells tile one 4 x 4 square: areas 4+4+1+2+1+2+2 = 16.
const CELLS = [
  [[0, 0], [4, 0], [2, 2]],
  [[0, 0], [2, 2], [0, 4]],
  [[4, 0], [4, 2], [3, 1]],
  [[2, 2], [3, 1], [4, 2], [3, 3]],
  [[2, 2], [3, 3], [2, 4]],
  [[0, 4], [2, 2], [2, 4]],
  [[2, 4], [3, 3], [4, 2], [4, 4]],
];

// An intentionally asymmetric, non-overlapping rest composition on the same fixed board.
const REST = [
  [-73, -38, -10], [-91, 25, 10], [-10, -48, 32], [43, -37, -12],
  [88, -38, 18], [16, 29, -20], [72, 30, 8],
];

function centre(points) {
  const n = points.length;
  return points.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]);
}

function rounded(points) {
  const pts = fillet(points, points.map(() => 1.65), 4);
  return pts.map((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy);
    return { u: p[0], v: p[1], nu: dy / m, nv: -dx / m };
  });
}

function transform(ring, x, y, angle) {
  const a = rad(angle), c = Math.cos(a), s = Math.sin(a);
  return ring.map(q => ({
    u: x + q.u * c - q.v * s, v: y + q.u * s + q.v * c,
    nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c,
  }));
}

function ease(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

function transport(q) {
  return {
    move: ease((q - 0.25) / 0.5),
    rise: q < 0.25 ? ease((q - REST_PACK) / (0.25 - REST_PACK))
      : q > 0.75 ? 1 - ease((q - 0.75) / 0.25) : 1,
  };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.02);
  fit(C, [
    [-132, -76, -5], [132, -76, -5], [-132, 76, -5], [132, 76, -5],
    [-132, -76, 65], [132, -76, 65], [-132, 76, 65], [132, 76, 65],
  ], 200, 140);
  const P = proj(C), front = facing(C), root = mk("g", {}, svg);
  let spread = value, active = false, drawn = NaN, drawnRise = NaN, drawnSpread = NaN;
  const packing = spring(REST_PACK);

  const [boardRing, boardInner] = rings(-128, -73, 128, 73, 8, 2.2);
  const board = solid(root);
  put(board, prism(P, front, boardRing, boardInner, -4, 0));
  board.sil.classList.add("hi");

  const pieces = CELLS.map((cell, i) => {
    const world = cell.map(([x, y]) => [OX + x * UNIT, OY + y * UNIT]);
    const target = centre(world), local = world.map(p => [p[0] - target[0], p[1] - target[1]]);
    const outer = rounded(local), inner = outer.map(q => ({ ...q, u: q.u * 0.94, v: q.v * 0.94 }));
    return { target, outer, inner, rest: REST[i], el: solid(root), depth: 0 };
  });

  function accent() {
    board.sil.classList.toggle("hi", !active);
    pieces.forEach((piece, i) => piece.el.sil.classList.toggle("hi", active && i === 3));
  }

  function draw() {
    const q = clamp(packing.x, 0, 1);
    const travel = transport(q);
    if (travel.move === drawn && travel.rise === drawnRise && spread === drawnSpread) return;
    drawn = travel.move; drawnRise = travel.rise; drawnSpread = spread;
    pieces.forEach((piece, i) => {
      const [tx, ty] = piece.target, [rx, ry, ra] = piece.rest;
      const x = lerp(tx + (rx - tx) * spread, tx, travel.move);
      const y = lerp(ty + (ry - ty) * spread, ty, travel.move);
      const angle = ra * spread * (1 - travel.move), lift = travel.rise * (i + 1) * 8;
      const outer = transform(piece.outer, x, y, angle);
      const inner = transform(piece.inner, x, y, angle);
      piece.depth = Math.sqrt(3 / 8) * (x + y) + 0.5 * lift;
      put(piece.el, prism(P, front, outer, inner, Z0 + lift, Z1 + lift));
    });
    pieces.slice().sort((a, b) => a.depth - b.depth).forEach(piece => root.appendChild(piece.el.g));
  }

  draw();
  read.textContent = "rest";
  const loop = register(stage, dt => {
    const moving = stepS(packing, dt);
    draw();
    return moving;
  });
  bag.add(loop.unregister);

  function release() {
    active = false;
    packing.t = REST_PACK;
    read.textContent = "rest";
    accent();
    loop.wake();
  }

  function aim([x, y]) {
    if (x < HIT[0] || x > HIT[1] || y < HIT[2] || y > HIT[3]) return release();
    active = true;
    packing.t = clamp((x - 60) / 280, 0, 1);
    read.textContent = `pack ${Math.round(packing.t * 100)}%`;
    accent();
    loop.wake();
  }

  bag.add(pointer(stage, { move: aim, down: aim, leave: release }));
  bag.add(() => svg.replaceChildren());

  return {
    set: next => { spread = clamp(next, 0.82, 1.18); drawnSpread = NaN; draw(); loop.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "possibility-tangram",
  means: "Seven fixed puzzle pieces pack into one compact square, leaving the rest of the work surface free.",
  rules: [1, 3, 4, 5, 6, 7, 8, 9, 10],
  range: [0.82, 1, 1.18],
  mount,
});
