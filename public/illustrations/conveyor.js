const {
  Cam, circ, clamp, disposer, facing, fit, flatDot, mk, open, place, pointer,
  prism, proj, put, register, rings, seg, solid, spring, stepS, unproj,
} = HL;

const REST_GAP = 18, BED_Z = 13, GATE_X = 30, OUTER_Y = 30;
const shift = (ring, x, y) => ring.map((p) => ({ ...p, u: p.u + x, v: p.v + y }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let maxGap = value, active = false, lastGap = NaN;
  const camera = Cam(45, 0.5, 1.58);
  fit(camera, [[-76, -39, -23], [74, 39, -23], [-76, 39, 52], [74, -39, 52]], 200, 166);
  const project = proj(camera), front = facing(camera);
  const root = mk("g", {}, svg);

  const makeSolid = (x0, y0, x1, y1, radius, inset, z0, z1, parent = root) => {
    const body = solid(parent), [ring, inner] = rings(x0, y0, x1, y1, radius, inset);
    put(body, prism(project, front, ring, inner, z0, z1));
    return body;
  };

  [[-64, -31], [-64, 23], [56, -31], [56, 23]].forEach(([x, y]) =>
    makeSolid(x, y, x + 8, y + 8, 2.8, 0.9, -22, 9));

  const rollers = mk("g", {}, root);
  for (let x = -62; x <= 58; x += 20) makeSolid(x - 5, -26, x + 5, 26, 5, 1, 9, BED_Z, rollers);
  makeSolid(-70, -35, 70, -27, 3.6, 1.1, 5, 16);
  makeSolid(-70, 27, 70, 35, 3.6, 1.1, 5, 16);

  const parts = [];
  const centres = [[-45, -8], [-23, 8], [-2, -6]];
  centres.forEach(([x, y], index) => {
    const part = solid(root), outer = shift(circ(9.5, 28), x, y), inner = shift(circ(7.4, 28), x, y);
    put(part, prism(project, front, outer, inner, BED_Z, BED_Z + 12 + index));
    const bore = flatDot(root, camera, 1.25, "dot off");
    place(bore, project(x, y, BED_Z + 12 + index + 0.1));
    parts.push(part);
  });

  makeSolid(GATE_X - 6, -35, GATE_X + 6, -27, 3, 1, 10, 49);
  makeSolid(GATE_X - 6, 27, GATE_X + 6, 35, 3, 1, 10, 49);
  const guide = mk("path", { class: "nf lo dash" }, root);
  guide.setAttribute("d", open([
    project(GATE_X, -OUTER_Y, 39), project(GATE_X, OUTER_Y, 39),
  ]));
  makeSolid(GATE_X - 7, -35, GATE_X + 7, 35, 4, 1.1, 44, 50);

  const leftLeaf = solid(root), rightLeaf = solid(root);
  const gap = spring(REST_GAP);
  function drawGate() {
    const current = clamp(gap.x, REST_GAP, maxGap);
    if (current === lastGap) return;
    lastGap = current;
    const half = current / 2;
    const [leftRing, leftInner] = rings(GATE_X - 5, -OUTER_Y, GATE_X + 5, -half, 3.2, 1);
    const [rightRing, rightInner] = rings(GATE_X - 5, half, GATE_X + 5, OUTER_Y, 3.2, 1);
    put(leftLeaf, prism(project, front, leftRing, leftInner, BED_Z, 39));
    put(rightLeaf, prism(project, front, rightRing, rightInner, BED_Z, 39));
  }

  function highlight() {
    leftLeaf.sil.classList.toggle("hi", active);
    rightLeaf.sil.classList.toggle("hi", active);
    parts[2].sil.classList.toggle("hi", !active);
  }

  drawGate(); highlight();
  const loop = register(stage, (delta) => {
    const moving = stepS(gap, delta);
    drawGate();
    return moving;
  });
  bag.add(loop.unregister);

  function release() {
    active = false;
    gap.t = REST_GAP;
    read.textContent = "rest";
    highlight(); loop.wake();
  }

  function adjust(point) {
    const world = unproj(camera, point[0], point[1], 39);
    if (world[0] < GATE_X - 18 || world[0] > GATE_X + 18 || Math.abs(world[1]) > 43) return release();
    active = true;
    gap.t = clamp(Math.abs(world[1]) * 2, REST_GAP, maxGap);
    read.textContent = `gap ${Math.round(gap.t)}`;
    highlight(); loop.wake();
  }

  read.textContent = "rest";
  bag.add(pointer(stage, { move: adjust, down: adjust, leave: release }));
  bag.add(() => svg.replaceChildren());
  return {
    set: (next) => { maxGap = next; gap.t = clamp(gap.t, REST_GAP, maxGap); loop.wake(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "conveyor",
  means: "A roller conveyor holds machined parts while the pointer sets one measured gate opening.",
  rules: [1, 3, 4, 5, 6, 7, 8, 9, 10],
  range: [26, 34, 42],
  mount,
});
