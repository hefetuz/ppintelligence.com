import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceCoinAngle, rotateCoin, projectCoin, visibleFace, triangleTransform } from '../app/coin-geometry.ts';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} should equal ${b}`);
test('rotation advances in one direction and closes exactly after eight seconds', () => {
  let angle = .3;
  for (let i = 0; i < 480; i++) {
    const next = advanceCoinAngle(angle, 1 / 60);
    assert.ok(next > angle); angle = next;
  }
  near(angle, .3 + Math.PI * 2);
  const start = rotateCoin({ x: .8, y: .2, z: .115 }, .3);
  const end = rotateCoin({ x: .8, y: .2, z: .115 }, angle);
  near(start.x, end.x); near(start.y, end.y); near(start.z, end.z);
});
test('front and back alternate; neither face stretches across the edge-on view', () => {
  assert.equal(visibleFace(1, 0), true); assert.equal(visibleFace(-1, 0), false);
  assert.equal(visibleFace(1, Math.PI), false); assert.equal(visibleFace(-1, Math.PI), true);
  assert.equal(visibleFace(1, Math.PI / 2), false); assert.equal(visibleFace(-1, Math.PI / 2), false);
});
test('a marked surface point crosses to the opposite side instead of bouncing back', () => {
  const point = { x: 1, y: 0, z: 0 };
  near(rotateCoin(point, 0, 0).x, 1);
  near(rotateCoin(point, Math.PI / 2, 0).z, -1);
  near(rotateCoin(point, Math.PI, 0).x, -1);
  near(rotateCoin(point, Math.PI * 1.5, 0).z, 1);
});
test('perspective makes a near edge larger than a far edge', () => {
  const center = { x: 0, y: 0 };
  assert.ok(projectCoin({ x: 1, y: 0, z: 1 }, 60, center).x > projectCoin({ x: 1, y: 0, z: -1 }, 60, center).x);
});
test('texture mapping preserves all three projected vertices', () => {
  const source = [{ x: 320, y: 320 }, { x: 620, y: 320 }, { x: 320, y: 620 }];
  const target = [{ x: 100, y: 100 }, { x: 140, y: 105 }, { x: 96, y: 160 }];
  const [a, b, c, d, e, f] = triangleTransform(source, target);
  source.forEach((p, i) => { near(a * p.x + c * p.y + e, target[i].x); near(b * p.x + d * p.y + f, target[i].y); });
});
