import { mkdir, writeFile } from 'node:fs/promises';
import { siteConfiguration } from './site-config.mjs';
await mkdir('.generated', { recursive: true });
await writeFile('.generated/site-config.json', JSON.stringify(siteConfiguration(process.env), null, 2) + '\n');
