/**
 * Value transmission: three rounded gears on a low desk mechanism. The
 * pointer turns the input wheel; one spring carries that turn through the
 * actual tooth ratios, while the bright silhouette passes to the output.
 */
const {
  Cam, clamp, facing, fillet, fit, proj, unproj, circ, rings, prism, ringAt, run,
  poly, open, seg, spring, stepS, mk, pointer, put, register,
  disposer, solid,
} = HL;

const TAU = Math.PI * 2, REST = 0.16, Z = 7, TH = 3, SCALE = 1.72;
const MODULE = 2, PROFILE_PEAK = 7 / 16;
const A01 = Math.atan2(-12, 46), A12 = Math.atan2(-16, 47);
const c0 = [-43, 18], c1 = [c0[0] + 46 * Math.cos(A01), c0[1] + 46 * Math.sin(A01)];
const c2 = [c1[0] + 52 * Math.cos(A12), c1[1] + 52 * Math.sin(A12)];
const teeth = [14, 9, 17], restAngles = [REST, -REST * teeth[0] / teeth[1], REST * teeth[0] / teeth[2]];
const phase0 = A01 - restAngles[0] - TAU * PROFILE_PEAK / teeth[0];
const phase1 = A01 + Math.PI - restAngles[1];
const fraction = (v) => ((v % 1) + 1) % 1;
const u12 = fraction(teeth[1] * (A12 - restAngles[1] - phase1) / TAU);
const phase2 = A12 + Math.PI - restAngles[2] - TAU * fraction(PROFILE_PEAK - u12) / teeth[2];
const gears = [
  { x: c0[0], y: c0[1], pitch: 28, root: 24, outer: 32, teeth: teeth[0], phase: phase0 },
  { x: c1[0], y: c1[1], pitch: 18, root: 15, outer: 21, teeth: teeth[1], phase: phase1 },
  { x: c2[0], y: c2[1], pitch: 34, root: 30, outer: 39, teeth: teeth[2], phase: phase2 },
];
function angles(a) { return [a, -a * teeth[0] / teeth[1], a * teeth[0] / teeth[2]]; }
function meshPhase(i, j, a) {
  const aa = angles(a), q = Math.atan2(gears[j].y - gears[i].y, gears[j].x - gears[i].x);
  return fraction(gears[i].teeth * (q - aa[i] - gears[i].phase) / TAU + gears[j].teeth * (q + Math.PI - aa[j] - gears[j].phase) / TAU);
}

function gearRing(g, a) {
  const ring = [], profile = [0, 0.12, 0.78, 1, 1, 0.78, 0.12, 0];
  for (let t = 0; t < g.teeth; t++) for (let k = 0; k < profile.length; k++) {
    const q = a + g.phase + TAU * (t + k / profile.length) / g.teeth;
    const r = g.root + (g.outer - g.root) * profile[k];
    ring.push({ u: g.x + Math.cos(q) * r, v: g.y + Math.sin(q) * r, nu: Math.cos(q), nv: Math.sin(q) });
  }
  return ring;
}

function gearPaths(P, front, g, a) {
  const ring = gearRing(g, a), face = ringAt(P, ring, Z);
  const visible = run(ring, front);
  const inner = circ(g.root - 3, 30).map((s) => ({ ...s, u: s.u + g.x, v: s.v + g.y }));
  const rounded = fillet(face, face.map(() => 1.25), 2);
  return { sil: poly(rounded) + open(ringAt(P, visible, Z - TH)), crease: open(ringAt(P, run(inner, front), Z)) };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer(), C = Cam(45, 0.5, SCALE);
  fit(C, [[-85, -48, -9], [91, -48, -9], [-85, 54, -9], [91, 54, -9], [-43, 18, 17]], 200, 166);
  const P = proj(C), front = facing(C), root = mk("g", {}, svg);
  let reach = value, over = false, last = null, drawn = NaN, lit = -1;

  const [baseRing, baseInner] = rings(-80, -43, 86, 47, 18, 2.2);
  put(solid(root), prism(P, front, baseRing, baseInner, -9, -1));

  // Axle bosses sit behind the gears; the top plates then occlude them honestly.
  for (const g of gears) {
    const boss = circ(g.root * 0.48, 28).map((s) => ({ ...s, u: s.u + g.x, v: s.v + g.y }));
    const collar = circ(g.root * 0.48 - 1.4, 28).map((s) => ({ ...s, u: s.u + g.x, v: s.v + g.y }));
    put(solid(root), prism(P, front, boss, collar, -1, Z - TH));
  }

  const parts = gears.map((g) => {
    const group = mk("g", {}, root), el = solid(group), marks = mk("g", {}, group);
    return { g, group, el, marks, lines: [] };
  });
  // Paint far to near; the physical mesh itself does not depend on animation.
  [...parts].sort((a, b) => a.g.x + a.g.y - b.g.x - b.g.y).forEach((p) => root.appendChild(p.group));

  for (const p of parts) {
    const count = p.g === gears[2] ? 4 : 3;
    for (let i = 0; i < count; i++) p.lines.push(mk("path", { class: "lo nf" }, p.marks));
    const hub = circ(p.g === gears[1] ? 5.2 : 7, 28).map((s) => ({ ...s, u: s.u + p.g.x, v: s.v + p.g.y }));
    const inset = circ(p.g === gears[1] ? 4 : 5.6, 28).map((s) => ({ ...s, u: s.u + p.g.x, v: s.v + p.g.y }));
    put(solid(p.group), prism(P, front, hub, inset, Z, Z + 5));
  }

  const turn = spring(REST);
  function highlight(i) {
    if (lit === i) return;
    parts.forEach((p, n) => p.el.sil.classList.toggle("hi", n === i));
    lit = i;
  }
  function draw(a) {
    if (a === drawn) return;
    drawn = a;
    const aa = angles(a);
    parts.forEach((p, n) => {
      put(p.el, gearPaths(P, front, p.g, aa[n]));
      const count = p.lines.length, inner = p.g.root * 0.35, outer = p.g.root - 5;
      p.lines.forEach((line, i) => {
        const q = aa[n] + p.g.phase + TAU * i / count;
        line.setAttribute("d", seg(P(p.g.x + Math.cos(q) * inner, p.g.y + Math.sin(q) * inner, Z + 0.2), P(p.g.x + Math.cos(q) * outer, p.g.y + Math.sin(q) * outer, Z + 0.2)));
      });
    });
  }

  const loop = register(stage, (dt) => {
    const moving = stepS(turn, dt), error = Math.abs(turn.t - turn.x);
    draw(turn.x);
    highlight(over && error > 0.18 ? 0 : over && error > 0.035 ? 1 : 2);
    return moving;
  });
  bag.add(loop.unregister);

  function target(p) {
    last = p;
    const q = unproj(C, p[0], p[1], Z), dx = q[0] - gears[0].x, dy = q[1] - gears[0].y;
    over = Math.hypot(dx, dy) <= gears[0].outer;
    turn.t = over ? REST + clamp(dx / gears[0].outer, -1, 1) * reach * TAU : REST;
    read.textContent = over ? "turn" : "rest";
    loop.wake();
  }
  bag.add(pointer(stage, { move: target, down: target, leave: () => { last = null; over = false; turn.t = REST; read.textContent = "rest"; loop.wake(); } }));
  bag.add(() => svg.replaceChildren());
  draw(REST); highlight(2); read.textContent = "rest";

  return { set: (v) => { reach = v; if (last) target(last); }, destroy: bag.dispose };
}

hairline({
  name: "value-transmission",
  means: "A pointer-driven gear train carries one turn through physical ratios to its output wheel.",
  rules: [1, 3, 4, 5, 7, 8, 9],
  range: [0.45, 0.8, 1.15],
  mount,
});
