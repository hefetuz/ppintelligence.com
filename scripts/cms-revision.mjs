import { createHash } from 'node:crypto';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const types = ['siteSettings', 'founder', 'publication', 'speaking', 'venture', 'podcastReference', 'engagement'];
export function revisionHash(records) {
  if (!Array.isArray(records) || records.some(record => !record || typeof record._id !== 'string' ||
    typeof record._rev !== 'string' || /^(drafts|versions)\./.test(record._id))) {
    throw new Error('CMS revision response must contain published document revisions.');
  }
  return createHash('sha256').update(JSON.stringify(records.map(({ _id, _rev }) => ({ _id, _rev }))
    .sort((a, b) => a._id.localeCompare(b._id, 'en')))).digest('hex');
}

export async function checkRevision(env = process.env, fetcher = fetch) {
  const project = env.SANITY_PROJECT_ID;
  const dataset = env.SANITY_DATASET;
  if (!/^[a-z0-9]+$/.test(project || '') || !/^[a-z0-9_-]+$/.test(dataset || '')) {
    throw new Error('Set the CMS project and dataset before checking content.');
  }
  const url = new URL(`https://${project}.api.sanity.io/v2025-02-19/data/query/${dataset}`);
  url.searchParams.set('perspective', 'published');
  url.searchParams.set('query', `*[_type in ${JSON.stringify(types)} && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{_id,_rev}`);
  const response = await fetcher(url, { headers: env.SANITY_READ_TOKEN ? { Authorization: `Bearer ${env.SANITY_READ_TOKEN}` } : {}, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`CMS revision check failed (${response.status}).`);
  const revision = revisionHash((await response.json()).result);
  let previous;
  try {
    const origin = new URL(env.SITE_ORIGIN);
    if (origin.protocol !== 'https:') throw new Error('HTTPS required');
    const deployed = await fetcher(new URL('/content-revision.json', origin), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (deployed.ok) previous = (await deployed.json()).revision;
  } catch { /* A missing or unavailable previous fingerprint requires a build. */ }
  return { revision, changed: env.GITHUB_EVENT_NAME !== 'schedule' || previous !== revision };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await checkRevision();
  await mkdir('.generated', { recursive: true });
  await writeFile('.generated/content-revision.json', JSON.stringify({ revision: result.revision }) + '\n');
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${result.changed}\n`);
  console.log(JSON.stringify(result));
}
