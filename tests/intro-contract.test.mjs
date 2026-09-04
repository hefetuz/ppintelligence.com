import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const motionUrl = pathToFileURL(root + 'app/intro/motion.ts').href;
const records = [];
const gradient = { addColorStop() {} };
const ctx = new Proxy({}, {
  get(_, name) {
    if (name === 'createLinearGradient' || name === 'createRadialGradient') return () => gradient;
    if (name === 'getImageData') return (_, __, w, h) => {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 64; y < h - 64; y += 4) for (let x = 88; x < w - 88; x += 4) data[(y * w + x) * 4 + 3] = 255;
      return { data };
    };
    return (...args) => { records.push({ name, args }); };
  },
  set(_, name, value) { if (typeof value === 'number') assert.ok(Number.isFinite(value), String(name)); return true; },
});
globalThis.document = { createElement: () => ({ width: 256, height: 256, getContext: () => ctx }) };

for (const name of ['orbit', 'morph', 'hands']) {
  const path = root + 'app/intro/' + name + '.ts';
  try { await access(path); } catch { continue; }
  const source = (await readFile(path, 'utf8')).replace("from './motion'", `from '${motionUrl}'`);
  const module = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
  const definition = module[name + 'Intro'];
  for (const width of [320, 390, 768, 1440, 2560]) {
    const radius = Math.min(82, Math.max(40, width * .056));
    const env = {
      width, height: width < 760 ? 1030 : 960, sceneY: width < 760 ? 535 : 565, radius, sprite: {},
      fingertips: [{ x: width / 2 - radius * 1.4, y: 560 }, { x: width / 2 + radius * 1.4, y: 560 }],
      handSources: [0, 1].map(side => Array.from({ length: 100 }, (_, i) => ({ x: side ? width - i * width / 230 : i * width / 230, y: 560 + Math.sin(i) * 45, seed: i / 100, symbol: i % 6, tone: .6 }))),
    };
    test(`${name}: continuous frame contract at ${width}px, including skip and final loop`, () => {
      const renderer = definition.create();
      let previousAngle = -Infinity;
      for (let t = 0; t < 24; t += 1 / 60) {
        const frame = renderer.frame(t, env);
        for (const [key, value] of Object.entries(frame)) assert.ok(Number.isFinite(value), key);
        for (const key of ['coinAlpha', 'mint', 'hands', 'handLight', 'transfer']) assert.ok(frame[key] >= 0 && frame[key] <= 1, key);
        assert.ok(frame.coinRadius > 0);
        assert.ok(frame.angle >= previousAngle - 1e-12, 'rotation must never reverse');
        previousAngle = frame.angle;
      }
      const settled = renderer.frame(definition.duration + 1, env);
      assert.equal(settled.coinY, env.sceneY);
      assert.equal(settled.coinRadius, radius);
      assert.equal(settled.mint, 1); assert.equal(settled.hands, 1); assert.equal(settled.coinAlpha, 1);
      assert.ok(Math.abs(renderer.frame(20, env).angle - renderer.frame(12, env).angle - Math.PI * 2) < 1e-10);
      records.length = 0;
      for (let t = 0; t < definition.duration; t += .12) renderer.draw(ctx, t, env, renderer.frame(t, env));
      assert.ok(records.length > 0, 'concept draws visible content');
      for (const { name, args } of records) {
        for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg) && Math.abs(arg) < 1e7, String(name));
        if (name === 'arc') assert.ok(args[2] >= 0, 'arc radius');
      }
    });
  }
}
