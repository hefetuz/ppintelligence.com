const {
  Cam, clamp, circ, disposer, facing, fit, mk, open, pointer, prism, proj,
  put, rad, register, rings, seg, solid, spring, stepS, unproj,
} = HL;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const camera = Cam(45, 0.5, 1.82);
  fit(camera, [[-94, -27, 0], [94, 27, 0], [-94, 27, 95], [94, -27, 95]], 200, 166);
  const project = proj(camera), front = facing(camera);
  const drawing = mk('g', {}, svg);
  const base = solid(drawing), column = solid(drawing), pivot = solid(drawing);
  const [baseRing, baseInner] = rings(-26, -20, 26, 20, 9, 1.7);
  const [columnRing, columnInner] = rings(-5, -5, 5, 5, 3.8, 1);
  const [pivotRing, pivotInner] = rings(-10, -7, 10, 7, 6, 1.1);
  put(base, prism(project, front, baseRing, baseInner, 0, 7));
  put(column, prism(project, front, columnRing, columnInner, 7, 74));
  put(pivot, prism(project, front, pivotRing, pivotInner, 73, 78));

  const rearPan = mk('g', {}, drawing), beamGroup = mk('g', {}, drawing);
  const beam = solid(beamGroup), weight = solid(beamGroup);
  const [beamRing, beamInner] = rings(-75, -4, 75, 4, 3.6, 1);
  const [weightRing, weightInner] = rings(-7, -9, 7, 9, 3.8, 1.1);
  const frontPan = mk('g', {}, drawing);
  const circleRing = (radius, center) => circ(radius, 48).map(sample => ({ ...sample, u: sample.u + center }));
  const makePan = (parent, center, count) => {
    const chains = mk('path', { class: 'nf lo' }, parent);
    const pan = solid(parent), coins = [];
    const panRing = circleRing(23, center), panInner = circleRing(21.5, center);
    for (let index = 0; index < count; index++) {
      const coin = solid(parent);
      coins.push({ ...coin, ring: circleRing(10.5, center), inner: circleRing(9, center) });
    }
    return { center, chains, pan, panRing, panInner, coins };
  };
  const leftPan = makePan(rearPan, -70, 3), rightPan = makePan(frontPan, 70, 1);
  const weightPosition = spring(18);
  let reach = value, active = false, lastPosition = NaN;

  function draw() {
    const offset = clamp(weightPosition.x, -40, 40);
    if (offset === lastPosition) return;
    lastPosition = offset;
    const angle = rad(clamp(4 - (offset - 18) * 0.2, -7, 12));
    const rotatingProject = (horizontal, depth, height) => project(
      horizontal * Math.cos(angle) - (height - 75) * Math.sin(angle), depth,
      75 + horizontal * Math.sin(angle) + (height - 75) * Math.cos(angle),
    );
    put(beam, prism(rotatingProject, front, beamRing, beamInner, 73, 79));
    const weightProject = (horizontal, depth, height) => rotatingProject(horizontal + offset, depth, height);
    put(weight, prism(weightProject, front, weightRing, weightInner, 79, 91));
    for (const pan of [leftPan, rightPan]) {
      const center = pan.center * Math.cos(angle), anchor = 75 + pan.center * Math.sin(angle);
      const level = anchor - 31;
      const panProject = (horizontal, depth, height) => project(horizontal - pan.center + center, depth, height);
      const attachments = [[pan.center - 18, 0], [pan.center, -18], [pan.center, 18]];
      pan.chains.setAttribute('d', attachments.map(([horizontal, depth]) =>
        seg(rotatingProject(pan.center, 0, 75), panProject(horizontal, depth, level + 3)),
      ).join(''));
      put(pan.pan, prism(panProject, front, pan.panRing, pan.panInner, level, level + 3));
      pan.coins.forEach((coin, index) => put(coin,
        prism(panProject, front, coin.ring, coin.inner, level + 3 + index * 2.5, level + 5.5 + index * 2.5),
      ));
    }
  }

  function highlight() {
    weight.sil.classList.toggle('hi', active);
    leftPan.coins[2].sil.classList.toggle('hi', !active);
  }
  read.textContent = 'rest';
  highlight();
  draw();
  const loop = register(stage, elapsed => {
    const moving = stepS(weightPosition, elapsed);
    draw();
    return moving;
  });
  bag.add(loop.unregister);
  const aim = point => {
    if (point[0] < 48 || point[0] > 352 || point[1] < 40 || point[1] > 290) return release();
    const position = unproj(camera, point[0], point[1], 75);
    active = true;
    weightPosition.t = clamp(position[0], -reach, reach);
    read.textContent = 'balance ' + Math.round(weightPosition.t);
    highlight();
    loop.wake();
  };
  function release() {
    active = false;
    weightPosition.t = 18;
    read.textContent = 'rest';
    highlight();
    loop.wake();
  }
  bag.add(pointer(stage, { move: aim, down: aim, leave: release }));
  bag.add(() => svg.replaceChildren());
  return { set: next => { reach = next; weightPosition.t = clamp(weightPosition.t, -reach, reach); loop.wake(); }, destroy: bag.dispose };
}

hairline({
  name: 'balance',
  means: 'A penny-weighted balance: move the counterweight to bring competing business priorities into balance.',
  rules: [1, 3, 5, 6, 7, 8, 9],
  range: [12, 30, 40],
  mount,
});
