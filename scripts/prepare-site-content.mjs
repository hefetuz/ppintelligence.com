if (process.env.CONTENT_MODE !== 'sanity') throw new Error('This source release requires CONTENT_MODE=sanity.');
import { mkdir, writeFile } from 'node:fs/promises';
import { CONTENT_SOURCE } from '../app/site/content-source.ts';
import { preparePublicContent } from '../app/site/publication.ts';
import { loadContentSource } from './cms-source.mjs';
import { speakingRecords } from '../app/site/deniz-insights.ts';

const directory = new URL('../.generated/', import.meta.url);
const source = await loadContentSource(CONTENT_SOURCE);
const snapshot = preparePublicContent(source);
await mkdir(directory, { recursive: true });
await writeFile(new URL('site-content.json', directory), JSON.stringify(snapshot, null, 2) + '\n');
await writeFile(new URL('site-editorial.json', directory), JSON.stringify({
  managed: process.env.CONTENT_MODE === 'sanity',
  speaking: process.env.CONTENT_MODE === 'sanity' ? source.speaking : speakingRecords,
}, null, 2) + '\n');
console.log('Prepared public site content: ' + snapshot.insights.length + ' insights, ' + snapshot.team.length + ' team profiles.');
