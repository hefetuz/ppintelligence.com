const {
  Cam, facing, fillet, fit, open, poly, prism, proj, rings,
  tdone, tset, tval, tween, disposer, mk, pointer, put, register, solid,
} = HL;

const SPECS = [
  [-54, 18, 48, -10], [-34, 22, 57, -8], [-10, 19, 44, -12],
  [11, 24, 64, -7], [37, 20, 52, -11], [59, 17, 59, -9],
];
const REST_FOCUS = 3, THICK = 1.8, Y = 4, STAGGER = 40, NEIGHBOR = 0.16;

function report(spec) {
  const [x, width, height, angle] = spec;
  return {
    x, width, height, angle,
    shape: fillet(
      [[0, 0], [width, 0], [width, height], [0, height]],
      [2.2, 2.2, 3.8, 3.8], 5,
    ),
  };
}

function pose(P, item, pull) {
  const sine = Math.sin(item.angle * Math.PI / 180);
  const cosine = Math.cos(item.angle * Math.PI / 180);
  const face = (u, z) => P(item.x + u, Y + pull + z * sine, z * cosine);
  const back = (u, z) => P(item.x + u, Y + pull + z * sine - THICK * cosine, z * cosine + THICK * sine);
  return {
    back: poly(item.shape.map(([u, z]) => back(u, z))),
    face: poly(item.shape.map(([u, z]) => face(u, z))),
    crease: open([face(3.5, item.height - 3), face(item.width - 3.5, item.height - 3)]),
    corners: [face(0, 0), face(item.width, 0), face(item.width, item.height), face(0, item.height)],
  };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value, active = -2;
  const camera = Cam(45, 0.5, 1.76);
  fit(camera, [[-66, -22, -7], [84, 28, -7], [-66, 28, 0], [84, -22, 69]], 200, 166);
  const P = proj(camera), front = facing(camera), root = mk("g", {}, svg);

  const [baseRing, baseInner] = rings(-64, -19, 84, 25, 7, 1.5);
  const base = solid(root);
  put(base, prism(P, front, baseRing, baseInner, -6, 0));

  const [backRing, backInner] = rings(-62, -16, 82, -9, 3, 1.2);
  const backRail = solid(root);
  put(backRail, prism(P, front, backRing, backInner, 0, 13));

  const items = SPECS.map((spec) => {
    const item = report(spec), group = mk("g", {}, root);
    item.back = mk("path", { class: "lo" }, group);
    item.face = mk("path", { class: "sil" }, group);
    item.crease = mk("path", { class: "nf lo" }, group);
    item.pull = tween(0);
    item.last = [];
    return item;
  });

  const [lipRing, lipInner] = rings(-62, 17, 82, 23, 3, 1.2);
  // Painted after every report: its opaque body hides report bottoms inside the rack.
  const frontLip = solid(root);
  put(frontLip, prism(P, front, lipRing, lipInner, 0, 8));

  function write(item, slot, element, d) {
    if (item.last[slot] === d) return;
    item.last[slot] = d;
    element.setAttribute("d", d);
  }

  function draw(item, pull) {
    const q = pose(P, item, pull);
    write(item, 0, item.back, q.back);
    write(item, 1, item.face, q.face);
    write(item, 2, item.crease, q.crease);
  }

  items.forEach((item) => draw(item, 0));
  const restFaces = items.map((item) => pose(P, item, 0).corners);

  function inside(point, corners) {
    let sign = 0;
    for (let i = 0; i < corners.length; i++) {
      const a = corners[i], b = corners[(i + 1) % corners.length];
      const cross = (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
      if (Math.abs(cross) < 0.01) continue;
      const next = Math.sign(cross);
      if (sign && next !== sign) return false;
      sign = next;
    }
    return true;
  }

  function hit(point) {
    let choice = -1, distance = Infinity;
    restFaces.forEach((corners, index) => {
      if (!inside(point, corners)) return;
      const center = corners.reduce((sum, p) => [sum[0] + p[0] / 4, sum[1] + p[1] / 4], [0, 0]);
      const d = Math.hypot(point[0] - center[0], point[1] - center[1]);
      if (d < distance) { choice = index; distance = d; }
    });
    return choice;
  }

  const clock = register(stage, (_dt, now) => {
    let moving = false;
    items.forEach((item) => {
      draw(item, tval(item.pull, now));
      if (!tdone(item.pull, now)) moving = true;
    });
    return moving;
  });
  bag.add(clock.unregister);

  function setActive(choice) {
    if (choice === active) return;
    const origin = choice >= 0 ? choice : active >= 0 ? active : REST_FOCUS;
    active = choice;
    const now = performance.now();
    items.forEach((item, index) => {
      const distance = Math.abs(index - origin);
      const target = choice < 0 ? 0 : distance === 0 ? reach : distance === 1 ? reach * NEIGHBOR : 0;
      tset(item.pull, target, now, distance * STAGGER);
      item.face.classList.toggle("hi", index === (choice < 0 ? REST_FOCUS : choice));
    });
    read.textContent = choice < 0 ? "rest" : `report ${choice + 1}`;
    clock.wake();
  }

  setActive(-1);
  bag.add(pointer(stage, {
    move: (point) => setActive(hit(point)),
    down: (point) => setActive(hit(point)),
    leave: () => setActive(-1),
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (next) => {
      reach = next;
      if (active >= 0) {
        const now = performance.now();
        items.forEach((item, index) => {
          const distance = Math.abs(index - active);
          const target = distance === 0 ? reach : distance === 1 ? reach * NEIGHBOR : 0;
          tset(item.pull, target, now, distance * STAGGER);
        });
        clock.wake();
      }
    },
    destroy: bag.dispose,
  };
}

hairline({
  name: "reading-rack",
  means: "A curated rack of reports: the chosen report slides forward for reading as its immediate neighbours ease with it.",
  rules: [1, 2, 3, 4, 5, 7, 8, 9, 10],
  range: [7, 11, 15],
  mount,
});
