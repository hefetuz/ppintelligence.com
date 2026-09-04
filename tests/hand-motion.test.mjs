import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceHandSpring, handField, materialTone, surfaceWarp, touchWarp } from '../app/hand-motion.ts';

for (const direction of ['orbit', 'morph', 'hands']) {
  test(`${direction}: touch mesh retains its perimeter and has bounded local deformation`, () => {
    for (let a = 0; a < Math.PI * 2; a += .08) {
      const edge = touchWarp(direction, Math.cos(a) * 120, Math.sin(a) * 120, 120, 1.8, 1);
      assert.ok(Math.hypot(edge.x, edge.y) < 1e-8);
    }
    let maximum = 0;
    for (let x = -120; x <= 120; x += 12) for (let y = -120; y <= 120; y += 12) {
      const point = touchWarp(direction, x, y, 120, 1.8, 1, { x: 40, y: -30 });
      const distance = Math.hypot(point.x, point.y);
      assert.ok(Number.isFinite(distance) && distance < 30);
      maximum = Math.max(maximum, distance);
    }
    assert.ok(maximum > 1, 'material visibly responds');
  });
  test(`${direction}: the hand field is finite, bounded and zero outside its radius`, () => {
    for (let t = 0; t < 20; t += .13) for (let k = 0; k < 8; k++) {
      const field = handField(direction, { x: 200 + k * 14, y: 100 + k * 8, cx: 240, cy: 140, radius: 178, time: t, seed: k / 8, side: k % 2, strength: 1 });
      Object.values(field).forEach(value => assert.ok(Number.isFinite(value)));
      assert.ok(Math.abs(field.x) <= 130 && Math.abs(field.y) <= 115);
      assert.ok(field.weight >= 0 && field.weight <= 1);
    }
    const outside = handField(direction, { x: 500, y: 500, cx: 0, cy: 0, radius: 178, time: 1, seed: .5, side: 0, strength: 1 });
    assert.equal(outside.weight, 0); assert.ok(Math.abs(outside.x) === 0); assert.ok(Math.abs(outside.y) === 0);
  });
  test(`${direction}: material preserves luminance ordering and channel bounds`, () => {
    let previous = [-1, -1, -1];
    for (let l = 0; l <= 1; l += .01) {
      const color = materialTone(l, direction);
      color.forEach((c, i) => { assert.ok(c >= previous[i] && c >= 0 && c <= 255); }); previous = color;
    }
  });
  test(`${direction}: interruption retains velocity and release returns every grain home`, () => {
    for (const fps of [30, 60, 120]) {
      const point = { offsetX: 0, offsetY: 0, vx: 0, vy: 0, energy: 0 };
      for (let frame = 0; frame < fps; frame++) advanceHandSpring(point, { x: 60, y: -45, weight: 1 }, 1 / fps, direction);
      assert.ok(point.offsetX > 50 && point.offsetY < -35);
      const before = point.offsetX;
      advanceHandSpring(point, { x: -45, y: 20, weight: 1 }, 1 / fps, direction);
      assert.ok(Math.abs(point.offsetX - before) < 15, 'retargeting must not teleport');
      for (let frame = 0; frame < fps * 6; frame++) advanceHandSpring(point, { x: 0, y: 0, weight: 0 }, 1 / fps, direction);
      Object.values(point).forEach(value => assert.ok(Math.abs(value) < .01));
    }
  });
}
test('liquid deformation fades exactly to zero at every lens boundary', () => {
  for (let a = 0; a < Math.PI * 2; a += .02) {
    const warp = surfaceWarp(Math.cos(a) * 158, Math.sin(a) * 158, 158, 2, 1);
    assert.ok(Math.abs(warp.x) < 1e-10 && Math.abs(warp.y) < 1e-10);
  }
  const center = surfaceWarp(20, 30, 158, 2, 1);
  assert.ok(Math.hypot(center.x, center.y) > 1);
});
