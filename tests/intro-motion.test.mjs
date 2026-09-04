import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spinAngle, phase, bezier, projectedRim, TAU } from '../app/intro/motion.ts';
import { projectCoin, rotateCoin, COIN_HALF_DEPTH } from '../app/coin-geometry.ts';

test('intro particles and morph rings land on the coin projection', () => {
  for (let angle = -.22; angle < 7; angle += .1) for (let a = 0; a < TAU; a += .2) {
    const target = projectCoin(rotateCoin({ x: Math.cos(a), y: Math.sin(a), z: COIN_HALF_DEPTH }, angle), 160, { x: 0, y: 0 });
    const actual = projectedRim(a, 160, angle);
    assert.ok(Math.hypot(target.x - actual.x, target.y - actual.y) < 1e-9);
  }
});

test('intro rotation is monotonic including the speed ramp and the loop handoff', () => {
  let previous = spinAngle(0, 2.8);
  for (let t = 0; t < 24; t += 1 / 120) {
    const next = spinAngle(t, 2.8);
    assert.ok(next >= previous - 1e-12);
    previous = next;
  }
  assert.ok(Math.abs(spinAngle(15, 2.8) - spinAngle(7, 2.8) - TAU) < 1e-10);
});
test('stages clamp safely before and after their interval', () => {
  assert.equal(phase(-20, 1, 2), 0);
  assert.equal(phase(20, 1, 2), 1);
  assert.equal(phase(2, 1, 2), .5);
});
test('stream curves start and land at their exact anchors', () => {
  assert.equal(bezier(2, 40, -60, 9, 0), 2);
  assert.equal(bezier(2, 40, -60, 9, 1), 9);
});
