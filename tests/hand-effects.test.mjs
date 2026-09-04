import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const root = new URL('../app/', import.meta.url);
const source = (await readFile(new URL('hand-effects.ts', root), 'utf8')).replace("from './hand-motion'", `from '${new URL('hand-motion.ts', root).href}'`);
const { createHandEffects } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
let draws = 0;
const context = new Proxy({}, {
  get(_, name) {
    if (name === 'createLinearGradient' || name === 'createRadialGradient') return () => ({ addColorStop() {} });
    return (...args) => {
      if (name === 'drawImage') { draws++; assert.ok(args.slice(1).every(Number.isFinite)); }
      for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), String(name));
    };
  },
  set(_, name, value) { if (typeof value === 'number') assert.ok(Number.isFinite(value), String(name)); return true; },
});
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => context }) };
const fixture = () => ({
  ctx: context, material: {}, sprite: {}, width: 1200, height: 900, dpr: 1.75, sceneY: 550, coinRadius: 67,
  hands: [0, 1].map(side => ({ x: side ? 900 : 100, y: 500, width: 200, height: 100, side, points: Array.from({ length: 60 }, (_, n) => ({ x: 50 + n % 10 * 8, y: 10 + Math.floor(n / 10) * 7, symbol: n % 6, seed: n / 60, tone: .7, offsetX: 0, offsetY: 0, vx: 0, vy: 0, energy: 0 })) })),
  poses: [{ pivot: 0, dx: 0, dy: 0, rotation: 0 }, { pivot: 1200, dx: 0, dy: 0, rotation: 0 }],
  time: 0, delta: 1 / 60, pointer: { x: 180, y: 525, active: true, keyboard: false }, interactive: true, moving: true, reveal: 1,
});
for (const direction of ['orbit', 'morph', 'hands']) {
  test(`${direction}: only the hand silhouette activates; material responds and recovers`, () => {
    const effects = createHandEffects(direction), input = fixture();
    input.pointer.x = 600;
    for (let f = 0; f < 60; f++) { input.time += input.delta; effects.render(input); }
    assert.deepEqual(effects.pose(0), { dx: 0, dy: -0, rotation: 0 });
    input.pointer.x = 180;
    draws = 0;
    for (let f = 0; f < 120; f++) { input.time += input.delta; effects.render(input); }
    assert.ok(effects.pose(0).dx > 2, 'hovered hand responds');
    assert.equal(effects.pose(1).dx, -0, 'other hand is not dragged along');
    assert.ok(draws > 120, 'surface has a real drawn response');
    if (direction !== 'morph') assert.ok(input.hands[0].points.some(p => Math.hypot(p.offsetX, p.offsetY) > 20));
    const paused = input.hands[0].points.map(p => [p.offsetX, p.offsetY, p.energy]);
    input.moving = false; effects.render(input);
    assert.deepEqual(input.hands[0].points.map(p => [p.offsetX, p.offsetY, p.energy]), paused);
    input.moving = true; input.pointer.active = false;
    for (let f = 0; f < 600; f++) { input.time += input.delta; effects.render(input); }
    assert.ok(Math.abs(effects.pose(0).dx) < .001);
    for (const point of input.hands[0].points) assert.ok(Math.hypot(point.offsetX, point.offsetY) < .1);
    effects.clear();
  });
  test(`${direction}: reduced-motion starts as a stationary complete sculpture`, () => {
    const effects = createHandEffects(direction), input = fixture(); input.moving = false;
    draws = 0; effects.render(input);
    assert.equal(draws, 1); assert.equal(effects.pose(0).dx, 0); effects.clear();
  });
}
