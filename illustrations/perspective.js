const {
  Cam, circ, facing, fit, open, pointer, prism, proj, rings, seg, unproj,
  tdone, tset, tval, tween, disposer, mk, place, put, register, solid,
} = HL;

const COUNT = 5, WIDTH = 96, HEIGHT = 66, THICKNESS = 1.6;
const REST_X = [-18, -4, -22, -38, -55];
const REST_Y = [0, 12, 26, 40, 55];
const REST_Z = [0, 9, 18, 27, 36];
const OPEN_X = [0, 32, 40, 26, 52];
const OPEN_Y = [0, 42, 42, -8, 4];
const OPEN_Z = [0, 6, 8, 10, 12];

const shiftRing = (ring, x, y) => ring.map((sample) => ({
  u: sample.u + x,
  v: sample.v + y,
  nu: sample.nu,
  nv: sample.nv,
}));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stagger = value;
  const camera = Cam(45, 0.5, 1.6);
  fit(camera, [
    [-59, -4, 0], [128, -4, 0], [-59, 138, 0], [128, 138, 0],
    [-59, -4, 52], [128, -4, 52], [-59, 138, 52], [128, 138, 52],
  ], 220, 166);
  const project = proj(camera), front = facing(camera);
  const root = mk("g", {}, svg);
  const [sheetRing, sheetInner] = rings(0, 0, WIDTH, HEIGHT, 7, 1.5);
  const sheets = [];

  function makeSheet(index) {
    const group = mk("g", {}, root);
    const body = solid(group);
    const fold = mk("path", { class: "nf lo" }, group);
    const punches = [];
    for (let dot = 0; dot <= index; dot++) {
      punches.push(mk("circle", { r: 1.18, class: "dot off" }, group));
    }
    const sheet = {
      index, group, body, fold, punches,
      opening: tween(0), drawn: NaN,
    };
    sheets.push(sheet);
    return sheet;
  }

  function drawSheet(sheet, amount) {
    if (amount === sheet.drawn) return;
    sheet.drawn = amount;
    const index = sheet.index;
    const x = REST_X[index] + OPEN_X[index] * amount;
    const y = REST_Y[index] + OPEN_Y[index] * amount;
    const z = REST_Z[index] + OPEN_Z[index] * amount;
    put(sheet.body, prism(
      project,
      front,
      shiftRing(sheetRing, x, y),
      shiftRing(sheetInner, x, y),
      z,
      z + THICKNESS,
    ));
    sheet.fold.setAttribute("d", seg(
      project(x + WIDTH - 16, y + 1.5, z + THICKNESS),
      project(x + WIDTH - 1.5, y + 16, z + THICKNESS),
    ));
    sheet.punches.forEach((dot, punch) => place(
      dot,
      project(x + 9, y + 12 + punch * 7, z + THICKNESS + 0.05),
    ));
  }

  makeSheet(0);
  const coinCenter = [60, 18];
  const coinOuter = shiftRing(circ(13.5, 20), coinCenter[0], coinCenter[1]);
  const coinInner = shiftRing(circ(10.5, 20), coinCenter[0], coinCenter[1]);
  const coin = solid(root);
  put(coin, prism(project, front, coinOuter, coinInner, THICKNESS, THICKNESS + 1.2));
  for (let index = 1; index < COUNT; index++) makeSheet(index);

  function hit(point) {
    for (let index = COUNT - 1; index >= 0; index--) {
      const world = unproj(camera, point[0], point[1], REST_Z[index] + THICKNESS);
      if (
        world[0] >= REST_X[index] && world[0] <= REST_X[index] + WIDTH &&
        world[1] >= REST_Y[index] && world[1] <= REST_Y[index] + HEIGHT
      ) return index;
    }
    return -1;
  }

  const loop = register(stage, (_delta, now) => {
    let moving = false;
    sheets.forEach((sheet) => {
      drawSheet(sheet, tval(sheet.opening, now));
      if (!tdone(sheet.opening, now)) moving = true;
    });
    return moving;
  });
  bag.add(loop.unregister);

  let active = -2;
  function select(index) {
    if (index === active) return;
    const now = performance.now();
    const origin = index >= 0 ? index : active;
    active = index;
    sheets.forEach((sheet) => {
      const delay = origin < 0 ? 0 : Math.abs(sheet.index - origin) * stagger;
      tset(sheet.opening, index >= 0 && sheet.index > index ? 1 : 0, now, delay);
      sheet.body.sil.classList.toggle("hi", index > 0 && sheet.index === index);
      sheet.fold.setAttribute(
        "class",
        index < 0 && sheet.index === COUNT - 1 ? "nf hi" : "nf lo",
      );
    });
    coin.sil.classList.toggle("hi", index === 0);
    read.textContent = index < 0 ? "rest" : index === 0 ? "value" : `layer ${index + 1}`;
    loop.wake();
  }

  sheets.forEach((sheet) => drawSheet(sheet, 0));
  select(-1);
  bag.add(pointer(stage, {
    move: (point) => select(hit(point)),
    down: (point) => select(hit(point)),
    leave: () => select(-1),
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (next) => { stagger = next; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "perspective",
  means: "A layered analysis folio opens under the pointer until the penny at its centre comes into view.",
  rules: [1, 2, 4, 5, 8, 9, 10],
  range: [30, 45, 60],
  mount,
});
