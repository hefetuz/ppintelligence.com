const {
  Cam, circ, clamp, disposer, fillet, fit, hull, mk, open, pointer, poly,
  prism, proj, put, rad, register, ringAt, rrect, run, seg, solid, spring, stepS,
} = HL;

const REST_HEADING = 326, TILT = rad(36), FACE_W = 51;
const ct = Math.cos(TILT), st = Math.sin(TILT), q = Math.SQRT1_2;
// Local u is screen-horizontal, v climbs the tilted dial, and w is its normal.
const world = (u, v, w) => [q * u + q * (ct * v + st * w), -q * u + q * (ct * v + st * w), -st * v + ct * w];
const floor = (u, v, z) => [q * (u + v), q * (-u + v), z];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let needleReach = value, lastAngle = NaN, lastReach = NaN;
  const camera = Cam(45, 0.5, 2.2);
  const frame = [
    world(-54, 0, 42), world(54, 0, 42), world(0, -54, 46), world(0, 54, 42),
    floor(-50, 20, 1), floor(50, 73, -4),
  ];
  fit(camera, frame, 200, 166);
  const P = proj(camera), dialP = (u, v, w) => P(...world(u, v, w));
  const groundP = (u, v, z) => P(...floor(u, v, z));
  const dialFront = (p) => p.nv >= -1e-6, groundFront = dialFront;
  const root = mk("g", {}, svg);

  // A low rounded foot, an upright back, and a front catch make the tilt physical.
  const [footRing, footInner] = [rrect(-50, 20, 50, 73, 10, 10), rrect(-48, 22, 48, 71, 8, 10)];
  put(solid(root), prism(groundP, groundFront, footRing, footInner, -4, 1));
  const [backRing, backInner] = [rrect(-18, 24, 18, 48, 8, 8), rrect(-16.5, 25.5, 16.5, 46.5, 6.5, 8)];
  put(solid(root), prism(groundP, groundFront, backRing, backInner, 1, 29));

  const tiltedPrism = (radius, inset, w0, w1) => {
    const ring = circ(radius, 96), inner = circ(radius - inset, 96);
    return {
      sil: poly(hull(ringAt(dialP, ring, w1).concat(ringAt(dialP, ring, w0)))),
      crease: open(ringAt(dialP, run(inner, dialFront), w1)),
    };
  };
  put(solid(root), tiltedPrism(54, 2, 42, 46));
  put(solid(root), tiltedPrism(51.5, 3, 46, 49));
  put(solid(root), tiltedPrism(45, 1.5, 49, FACE_W));

  const ticks = mk("path", { class: "nf lo" }, root);
  ticks.setAttribute("d", Array.from({ length: 48 }, (_, index) => {
    const angle = rad(index * 7.5), major = index % 12 === 0;
    const inner = major ? 33.5 : index % 3 === 0 ? 36.5 : 39, outer = 42;
    return seg(dialP(Math.sin(angle) * inner, -Math.cos(angle) * inner, FACE_W + 0.1),
      dialP(Math.sin(angle) * outer, -Math.cos(angle) * outer, FACE_W + 0.1));
  }).join(""));
  const dial = mk("path", { class: "nf lo" }, root);
  dial.setAttribute("d", poly(circ(30, 72).map((p) => dialP(p.u, p.v, FACE_W + 0.1))));

  const needle = mk("path", { class: "sil hi" }, root);
  const spine = mk("path", { class: "nf lo" }, root);
  put(solid(root), tiltedPrism(5.8, 1.4, FACE_W + 1.2, FACE_W + 8));
  const heading = spring(REST_HEADING);
  function draw() {
    const angle = heading.x, reach = needleReach;
    if (angle === lastAngle && reach === lastReach) return;
    lastAngle = angle; lastReach = reach;
    const a = rad(angle), dx = Math.sin(a), dy = -Math.cos(a), nx = -dy, ny = dx;
    const tail = reach * 0.72;
    const points = [[dx * reach, dy * reach], [nx * 4.4, ny * 4.4],
      [-dx * tail, -dy * tail], [-nx * 4.4, -ny * 4.4]];
    const rounded = fillet(points, [3, 2.2, 3, 2.2], 4);
    needle.setAttribute("d", poly(rounded.map(([u, v]) => dialP(u, v, FACE_W + 2.2))));
    spine.setAttribute("d", open([dialP(-dx * (tail - 5), -dy * (tail - 5), FACE_W + 2.3),
      dialP(dx * (reach - 6), dy * (reach - 6), FACE_W + 2.3)]));
  }
  put(solid(root), tiltedPrism(3.4, 0.9, FACE_W + 8, FACE_W + 9.5));
  // The catch is nearest: it covers the bottom rim instead of showing through it.
  const [catchRing, catchInner] = [rrect(-34, 61, 34, 73, 5, 8), rrect(-32.5, 62.5, 32.5, 71.5, 3.5, 8)];
  put(solid(root), prism(groundP, groundFront, catchRing, catchInner, 1, 9));

  draw();
  const loop = register(stage, (delta) => { const moving = stepS(heading, delta); draw(); return moving; });
  bag.add(loop.unregister);
  const retarget = (target) => { heading.t += (((target - heading.t) % 360 + 540) % 360) - 180; };
  const release = () => { retarget(REST_HEADING); read.textContent = "rest"; loop.wake(); };

  // Invert the two projected basis vectors on the fixed inclined face plane.
  const origin = dialP(0, 0, FACE_W), du = dialP(1, 0, FACE_W), dv = dialP(0, 1, FACE_W);
  const ux = du[0] - origin[0], uy = du[1] - origin[1], vx = dv[0] - origin[0], vy = dv[1] - origin[1];
  const det = ux * vy - uy * vx;
  function aim(point) {
    const sx = point[0] - origin[0], sy = point[1] - origin[1];
    const u = (sx * vy - sy * vx) / det, v = (sy * ux - sx * uy) / det;
    const distance = Math.hypot(u, v);
    if (distance < 10 || distance > 67) return release();
    const target = (Math.atan2(u, -v) * 180 / Math.PI + 360) % 360;
    retarget(target);
    read.textContent = `${String(Math.round(target)).padStart(3, "0")}°`;
    loop.wake();
  }
  read.textContent = "rest";
  bag.add(pointer(stage, { move: aim, down: aim, leave: release }));
  bag.add(() => svg.replaceChildren());
  return { set: (next) => { needleReach = clamp(next, 27, 42); lastReach = NaN; draw(); }, destroy: bag.dispose };
}

hairline({
  name: "compass",
  means: "An inclined desk compass turns its needle toward the pointer and reports that heading.",
  rules: [1, 3, 4, 5, 7, 8, 9, 10],
  range: [30, 36, 42],
  mount,
});
