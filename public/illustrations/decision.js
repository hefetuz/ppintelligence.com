const {
  Cam, clamp, facing, fillet, fit, hull, open, poly, proj, rad, ringAt, rings, prism,
  tdone, tset, tval, tween, disposer, mk, place, pointer, register, solid, put,
} = HL;

const COUNT = 6, WIDTH = 86, HEIGHT = 55, GAP = 14, TAB_W = 20, TAB_H = 8, THICK = 1.5;
const X0 = -7, X1 = WIDTH + 7, Y0 = -10, Y1 = (COUNT - 1) * GAP + 10;
const REST_ANGLE = [-16, -13, -10, -11, -14, -17];
const REST_LIFT = [0, 1, 3, 2, 1, 0], REST_FOCUS = 2, ACTIVE_LIFT = 19;
const TAB_X = [5, 18, 31, 44, 57, 61];

function folderPlate(P, y, height, notch) {
  const points = notch
    ? [[X0, 0], [X1, 0], [X1, height], [61, height], [58, height - 5], [46, height - 7], [34, height - 5], [31, height], [X0, height]]
    : [[X0, 0], [X1, 0], [X1, height], [X0, height]];
  const shape = fillet(points, points.map((_, i) => notch && i > 2 && i < 8 ? 2.4 : 4), 4);
  return poly(shape.map(([x, z]) => P(x, y, z)));
}

function makeCard(index) {
  const tab = TAB_X[index];
  const shape = fillet(
    [[0, 0], [WIDTH, 0], [WIDTH, HEIGHT], [tab + TAB_W, HEIGHT], [tab + TAB_W, HEIGHT + TAB_H],
      [tab, HEIGHT + TAB_H], [tab, HEIGHT], [0, HEIGHT]],
    [2, 2, 4, 2, 3, 3, 2, 4], 4,
  );
  return { tab, shape };
}

function cardPose(P, index, card, angle, lift) {
  const baseY = index * GAP, sine = Math.sin(rad(angle)), cosine = Math.cos(rad(angle));
  const face = (x, z) => P(x, baseY + z * sine, z * cosine + lift);
  const back = (x, z) => P(x, baseY + z * sine - THICK * cosine, z * cosine + THICK * sine + lift);
  const lengths = [66 - index * 3, 49 + index * 2, 59 - index];
  const scoreY = [HEIGHT - 15, HEIGHT - 23, HEIGHT - 31];
  const dots = Array.from({ length: 4 }, (_, k) => face(card.tab + 5 + k * 3.4, HEIGHT + TAB_H / 2));
  return {
    back: poly(card.shape.map(([x, z]) => back(x, z))),
    face: poly(card.shape.map(([x, z]) => face(x, z))),
    fold: open([face(7, HEIGHT - 8), face(WIDTH - 7, HEIGHT - 8)]),
    scores: scoreY.map((z, k) => open([face(8, z), face(8 + lengths[k], z)])).join(""),
    dots,
  };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stagger = value, active = -2;
  const camera = Cam(45, 0.5, 1.68);
  fit(camera, [[X0, Y0, -4], [X1, Y1, 0], [X0, Y1, 0], [X1, Y0, HEIGHT + TAB_H + ACTIVE_LIFT]], 200, 166);
  const P = proj(camera), front = facing(camera);
  const root = mk("g", {}, svg);
  const [baseRing, baseInner] = rings(X0, Y0, X1, Y1, 7, 1.4);
  const base = solid(root);
  put(base, prism(P, front, baseRing, baseInner, -4, 0));
  mk("path", { d: folderPlate(P, Y0 + 1, 28, false), class: "sil" }, root);
  mk("path", { d: open([P(X0 + 4, Y0 + 1, 4), P(X1 - 4, Y0 + 1, 4)]), class: "nf lo" }, root);

  const cards = [];
  for (let index = 0; index < COUNT; index++) {
    const geometry = makeCard(index), group = mk("g", {}, root);
    const back = mk("path", { class: "lo" }, group), face = mk("path", { class: "sil" }, group);
    const fold = mk("path", { class: "nf" }, group), scores = mk("path", { class: "nf lo" }, group);
    const dots = Array.from({ length: 4 }, (_, k) => mk("circle", { r: 1.05, class: `dot ${k === index % 4 ? "m" : "off"}` }, group));
    cards.push({ ...geometry, back, face, fold, scores, dots, angle: tween(REST_ANGLE[index]), lift: tween(REST_LIFT[index]), last: [] });
  }

  mk("path", { d: folderPlate(P, Y1 - 1, 23, true), class: "sil" }, root);
  mk("path", { d: open([P(X0 + 5, Y1 - 1, 4), P(X1 - 5, Y1 - 1, 4)]), class: "nf lo" }, root);

  function write(card, slot, element, d) {
    if (card.last[slot] === d) return;
    card.last[slot] = d;
    element.setAttribute("d", d);
  }

  function draw(index, angle, lift) {
    const card = cards[index], pose = cardPose(P, index, card, angle, lift);
    write(card, 0, card.back, pose.back); write(card, 1, card.face, pose.face);
    write(card, 2, card.fold, pose.fold); write(card, 3, card.scores, pose.scores);
    card.dots.forEach((dot, k) => {
      const point = pose.dots[k], key = `${point[0].toFixed(2)},${point[1].toFixed(2)}`;
      if (card.last[4 + k] !== key) { card.last[4 + k] = key; place(dot, point); }
    });
  }

  const bands = cards.map((card, index) => {
    const angle = REST_ANGLE[index], lift = REST_LIFT[index], sine = Math.sin(rad(angle)), cosine = Math.cos(rad(angle));
    const z = HEIGHT + TAB_H / 2;
    const a = P(0, index * GAP + z * sine, z * cosine + lift);
    const b = P(WIDTH, index * GAP + z * sine, z * cosine + lift);
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]), ex = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
    return { center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], ex, half: length / 2 + 8 };
  });

  function hit(point) {
    let choice = -1, nearest = 12;
    bands.forEach((band, index) => {
      const dx = point[0] - band.center[0], dy = point[1] - band.center[1];
      const along = dx * band.ex[0] + dy * band.ex[1], across = Math.abs(-dx * band.ex[1] + dy * band.ex[0]);
      if (Math.abs(along) <= band.half && across < nearest) { choice = index; nearest = across; }
    });
    return choice;
  }

  const clock = register(stage, (_dt, now) => {
    let moving = false;
    cards.forEach((card, index) => {
      draw(index, tval(card.angle, now), tval(card.lift, now));
      if (!tdone(card.angle, now) || !tdone(card.lift, now)) moving = true;
    });
    return moving;
  });
  bag.add(clock.unregister);

  function setActive(choice) {
    if (choice === active) return;
    const now = performance.now(), origin = choice >= 0 ? choice : active >= 0 ? active : REST_FOCUS;
    active = choice;
    cards.forEach((card, index) => {
      const distance = Math.abs(index - origin), delay = distance * stagger;
      let angle = REST_ANGLE[index], lift = REST_LIFT[index];
      if (choice >= 0) {
        const separation = clamp(12 - Math.abs(index - choice) * 2, 5, 12);
        angle = index === choice ? -2 : REST_ANGLE[index] + (index < choice ? -separation : separation);
        if (index === choice) lift += ACTIVE_LIFT;
      }
      tset(card.angle, angle, now, delay); tset(card.lift, lift, now, delay);
      const highlighted = index === (choice < 0 ? REST_FOCUS : choice);
      card.face.classList.toggle("hi", highlighted); card.fold.classList.toggle("hi", highlighted);
    });
    read.textContent = choice < 0 ? "rest" : String(choice + 1).padStart(2, "0");
    clock.wake();
  }

  setActive(-1);
  bag.add(pointer(stage, { move: (point) => setActive(hit(point)), down: (point) => setActive(hit(point)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  return { set: (next) => { stagger = next; }, destroy: bag.dispose };
}

hairline({
  name: "decision",
  means: "A decision folio: the chosen report rises while neighbouring cards open space for independent thinking.",
  rules: [1, 2, 4, 5, 8, 10],
  range: [30, 45, 60],
  mount,
});
