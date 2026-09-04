import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderBudget, handLayout } from '../app/render-budget.ts';

test('pixel budget holds on phones, 16:9 laptops, desktop and 4K screens', () => {
  for (const [width, height] of [[320, 920], [390, 920], [768, 1024], [1366, 768], [1920, 1080], [2560, 1440], [3840, 2160]]) {
    for (const constrained of [false, true]) {
      const budget = renderBudget(width, height, 3, constrained);
      assert.ok(width * height * budget.dpr ** 2 <= (constrained ? 1150000 : 2200000) + 1);
      assert.ok(budget.dpr > 0 && budget.meshCells <= 9);
    }
  }
});

test('full-bleed forearms preserve positive source partitions at every layout', () => {
  for (const width of [320, 390, 760, 1366, 1920, 2560, 3840]) for (const height of [240, 300, 480, 720]) {
    const radius = Math.min(82, Math.max(40, width * .056));
    const l = handLayout(width, height, radius);
    const left = (width - l.artWidth) / 2 + l.artWidth * .023;
    const native = l.artWidth * .477;
    const originalX = left - l.clearance;
    const finalWidth = originalX + native + l.bleed;
    const extendedForearm = native * .32 + finalWidth - native;
    assert.ok(extendedForearm > 0);
    assert.ok(finalWidth > 0);
    assert.ok(l.artWidth <= Math.max(180, height - 30) * 2.65 + 1e-8);
    assert.ok(-l.bleed < -20, 'idle wrist movement cannot reveal the outside cut');
  }
});
