import { readdir, readFile, stat, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const textFile = /\.(?:html|css|[cm]?js|json|svg)$/i;
const posix = (value) => value.split(path.sep).join('/');

export async function filesBelow(directory) {
  const found = [];
  async function walk(current) {
    for (const item of await readdir(current, { withFileTypes: true })) {
      // Never publish nested repositories, local settings or symlink targets.
      if (item.name.startsWith('.') || item.isSymbolicLink()) continue;
      const absolute = path.join(current, item.name);
      if (item.isDirectory()) await walk(absolute);
      else if (item.isFile()) found.push(posix(path.relative(directory, absolute)));
    }
  }
  await walk(directory);
  return found.sort();
}

function references(text, relativeTo, available) {
  const result = new Set();
  // Absolute assetUrl() arguments and CSS references survive bundling unchanged.
  for (const name of available) if (text.includes(name)) result.add(name);
  // JSON atlas manifests, SVG hrefs, public JS imports and CSS also use siblings.
  const tokens = text.matchAll(/["'`(]([^"'`<>\s()]+)["'`)]/g);
  for (const [, token] of tokens) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(token)) continue;
    let clean;
    try { clean = decodeURIComponent(token.split(/[?#]/, 1)[0]); } catch { continue; }
    const candidates = clean.startsWith('/')
      ? [clean.slice(1)]
      : [path.posix.normalize(path.posix.join(relativeTo, clean)), clean];
    for (const name of candidates) if (available.has(name)) result.add(name);
  }
  return result;
}

function dynamicRoots(available) {
  return [...available].filter((name) =>
    // Figure names and coin styles are chosen at runtime. Manifests provide the
    // exact atlas closure; proof images and superseded exports are not roots.
    /^illustrations\/[^/]+(?:\.js|-rest\.svg)$/.test(name) ||
    /^illustrations\/coin-styles\/[^/]+\/(?:calibre\/manifest|watch\/watch-manifest)\.json$/.test(name) ||
    /^illustrations\/coin-systems-v2\/(?:outline\/)?manifest\.json$/.test(name) ||
    /^experiments\/clockwork-hero\/assets\/[^/]+\.svg$/.test(name) ||
    /^experiments\/reference-painted\/hands-(?:engraving|wireframe)-v2\.png$/.test(name) ||
    /^assets\/employers\/(?:moodys\.svg|chatham-financial\.svg|bread-financial\.svg|tabapay\.png)$/.test(name) ||
    /^assets\/company\/pretty-penny-records\/.*\.svg$/.test(name) ||
    /^vendor\/draco\//.test(name) ||
    name === 'experiments/clockwork-isometric/movement-layer.webp' ||
    name === 'media/scroll/penny-film-poster.webp' ||
    /^fonts\/.*(?:license|ofl)\.txt$/i.test(name)
  );
}

export async function selectRuntimeAssets(publicDirectory, outputDirectory, { extraRoots = [] } = {}) {
  const publicFiles = await filesBelow(publicDirectory);
  const available = new Set(publicFiles);
  // Only generated bundles/routes are entry points. Unreferenced public study
  // pages must not keep themselves (or their private dependencies) alive.
  const generated = (await filesBelow(outputDirectory)).filter((name) => !available.has(name) || name === 'index.html');
  const selected = new Set();
  const pending = [];
  function add(name) {
    if (!available.has(name) || selected.has(name)) return;
    selected.add(name);
    pending.push(name);
  }
  for (const name of [...dynamicRoots(available), ...extraRoots]) add(name);
  for (const name of generated) {
    if (!textFile.test(name)) continue;
    const text = await readFile(path.join(outputDirectory, name), 'utf8');
    for (const reference of references(text, '', available)) add(reference);
  }
  while (pending.length) {
    const name = pending.pop();
    if (!textFile.test(name)) continue;
    const text = await readFile(path.join(publicDirectory, name), 'utf8');
    for (const reference of references(text, path.posix.dirname(name), available)) add(reference);
  }
  return { selected: [...selected].sort(), excluded: publicFiles.filter((name) => !selected.has(name)) };
}

export async function copyRuntimeAssets(root = process.cwd()) {
  const publicDirectory = path.join(root, 'public');
  const outputDirectory = path.join(root, 'dist-presentation');
  const selection = await selectRuntimeAssets(publicDirectory, outputDirectory);
  let bytes = 0, excludedBytes = 0;
  for (const name of selection.selected) {
    const source = path.join(publicDirectory, name);
    const destination = path.join(outputDirectory, name);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
    bytes += (await stat(source)).size;
  }
  for (const name of selection.excluded) excludedBytes += (await stat(path.join(publicDirectory, name))).size;
  const report = { publicBytes: bytes + excludedBytes, copiedBytes: bytes, excludedBytes, ...selection };
  const reportDirectory = path.join(root, 'outputs', 'deployment-size');
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(path.join(reportDirectory, 'runtime-assets.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Runtime public assets: ${selection.selected.length} files, ${(bytes / 1e6).toFixed(2)} MB; excluded ${(excludedBytes / 1e6).toFixed(2)} MB of unreferenced studies.`);
  if (bytes > 50_000_000) throw new Error('Runtime public assets exceed the 50 MB budget; review outputs/deployment-size/runtime-assets.json.');
  return report;
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await copyRuntimeAssets();
