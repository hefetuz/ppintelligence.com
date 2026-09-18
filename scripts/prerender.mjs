import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

const output = path.resolve('dist-presentation');
const template = await readFile(path.join(output, 'index.html'), 'utf8');
const server = await createServer({ configFile: 'vite.presentation.config.ts', server: { middlewareMode: true }, appType: 'custom' });
const escapeAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

try {
  const { Site, pageMeta, setStaticAssetBase } = await server.ssrLoadModule('/routes.tsx');
  setStaticAssetBase(template.match(/<base href="([^"]*)"/)?.[1] || '/');
  const pages = { ...pageMeta, '/404.html': { title: 'Page not found | Pretty Penny Intelligence', description: 'Find your way back to Pretty Penny Intelligence.' } };
  for (const [pathname, metadata] of Object.entries(pages)) {
    const markup = renderToString(createElement(Site, { pathname }));
    const html = template
      .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
      .replace(/<title>.*?<\/title>/, `<title>${escapeAttribute(metadata.title)}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeAttribute(metadata.description)}" />`);
    const target = pathname === '/404.html' ? path.join(output, '404.html') : path.join(output, pathname, 'index.html');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
    console.log(`Rendered ${pathname}`);
  }
} finally {
  await server.close();
}
