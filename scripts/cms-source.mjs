import { preparePublicContent, safeHttps, safeSlug } from '../app/site/publication.ts';

const TYPES = ['siteSettings', 'founder', 'publication', 'speaking', 'venture', 'podcastReference', 'engagement'];
export const CMS_QUERY = '*[_type in $types && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]';
const published = { status: 'published', companyApproved: true };
const text = (value, path) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`CMS: ${path} must contain text.`);
  return value.trim();
};
const list = (value, path) => {
  if (!Array.isArray(value)) throw new Error(`CMS: ${path} must be a list.`);
  return value.map((entry, i) => text(entry, `${path}[${i}]`));
};
const optional = (value, path) => value == null || value === '' ? undefined : text(value, path);
const https = (value, path) => { const result = text(value, path); if (!safeHttps(result)) throw new Error(`CMS: ${path} must be an HTTPS URL.`); return result; };
const image = (value, path) => value ? {
  src: text(value.assetUrl ?? value.src, `${path}.src`),
  alt: text(value.alt, `${path}.alt`), reuseApproved: value.reuseApproved === true,
} : undefined;
const copyList = (value, path, fields, count) => {
  if (!Array.isArray(value) || (count ? value.length !== count : value.length > 10)) throw new Error(`CMS: ${path} must contain ${count || 'at most 10'} entries.`);
  return value.map((entry, i) => Object.fromEntries(fields.map(key => [key, text(entry?.[key], `${path}[${i}].${key}`)])));
};

export function validEditorialDate(value) {
  if (typeof value !== 'string' || !/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return false;
  const full = value.length === 4 ? value + '-01-01' : value.length === 7 ? value + '-01' : value;
  const date = new Date(full + 'T00:00:00Z');
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === full;
}

export function mapSpeakingDocument(doc) {
  const id = text(doc._id, 'speaking.id');
  if (doc._type !== 'speaking' || /^(drafts|versions)\./.test(id)) throw new Error('CMS: only published speaking documents are allowed.');
  if (!['past', 'upcoming'].includes(doc.status)) throw new Error(`CMS: ${id} needs Past or Upcoming status.`);
  if (doc.format != null && !['conference', 'media'].includes(doc.format)) throw new Error(`CMS: ${id} has an unsupported speaking format.`);
  const date = optional(doc.date, `${id}.date`);
  if (date && !validEditorialDate(date)) throw new Error(`CMS: ${id} needs a real YYYY, YYYY-MM or YYYY-MM-DD date.`);
  const media = doc.media ? { src: text(doc.media.assetUrl ?? doc.media.src, `${id}.media.src`), alt: text(doc.media.alt, `${id}.media.alt`) } : undefined;
  if (media && !(safeHttps(media.src) || (/^\/(?!\/)[a-zA-Z0-9/_ .-]+$/.test(media.src) && !media.src.split('/').includes('..')))) throw new Error(`CMS: ${id} has an unsafe image path.`);
  if (media && doc.media.reuseApproved !== true) throw new Error(`CMS: ${id} image needs permission.`);
  return {
    id, title: text(doc.title, `${id}.title`), event: text(doc.event, `${id}.event`),
    role: text(doc.role, `${id}.role`), summary: text(doc.summary, `${id}.summary`),
    status: doc.status, format: doc.format, date, dateLabel: optional(doc.dateLabel, `${id}.dateLabel`),
    href: doc.href ? https(doc.href, `${id}.href`) : undefined,
    action: optional(doc.action, `${id}.action`), ...(media ? { media } : {}),
  };
}

/** Explicit mapping: CMS editorial fields do not become arbitrary browser properties. */
export function mapPublishedDocuments(documents, defaults) {
  if (!Array.isArray(documents)) throw new Error('CMS: query did not return documents.');
  const ids = new Set();
  for (const doc of documents) {
    if (!doc || typeof doc !== 'object' || !TYPES.includes(doc._type)) throw new Error('CMS: unsupported document.');
    const id = text(doc._id, 'document ID');
    if (id.startsWith('drafts.') || id.startsWith('versions.')) throw new Error('CMS: unpublished document in published response.');
    if (ids.has(id)) throw new Error(`CMS: duplicate document ${id}.`);
    ids.add(id);
  }
  const settingsDocs = documents.filter(doc => doc._type === 'siteSettings');
  if (settingsDocs.length !== 1) throw new Error('CMS: publish exactly one Site settings document.');
  const settings = settingsDocs[0];
  if (settings.services != null && (!Array.isArray(settings.services) || settings.services.some(item => !item || !['strategy', 'risk', 'economics'].includes(item.id)) || new Set(settings.services.map(item => item.id)).size !== settings.services.length)) throw new Error('CMS: service descriptions need unique strategy, risk or economics IDs.');
  const founders = documents.filter(doc => doc._type === 'founder');
  if (founders.length > 1) throw new Error('CMS: only one founder profile is supported.');
  const source = {
    topics: defaults.topics.map(topic => {
      const copy = settings.services?.find(item => item.id === topic.id);
      return copy ? { ...topic, ...Object.fromEntries(['name', 'lead', 'summary', 'question'].filter(key => copy[key] != null).map(key => [key, text(copy[key], `services.${topic.id}.${key}`)])) } : { ...topic };
    }),
    expertise: [], insights: [], team: [], engagements: [], logos: [], ventures: [], references: [],
    speaking: documents.filter(doc => doc._type === 'speaking').map(mapSpeakingDocument),
    contact: {
      bookingUrl: https(settings.bookingUrl, 'bookingUrl'),
      companyLinkedIn: https(settings.companyLinkedIn, 'companyLinkedIn'),
      durationMinutes: 15,
      participant: text(settings.participant, 'participant'),
      mode: text(settings.meetingMode, 'meetingMode'),
      email: text(settings.email, 'email'), emailApproved: true,
    },
  };
  if (!/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(source.contact.email)) throw new Error('CMS: invalid contact email.');
  if (settings.socialLinks) source.socialLinks = Object.fromEntries(['substack', 'personalLinkedIn', 'x', 'podcast'].filter(key => settings.socialLinks[key]).map(key => [key, https(settings.socialLinks[key], `socialLinks.${key}`)]));
  if (settings.pageCopy) {
    const fields = { home: ['heading', 'description'], company: ['heading', 'description', 'approachHeading', 'processHeading'], contact: ['heading', 'description'] };
    source.pageCopy = {};
    for (const [page, keys] of Object.entries(fields)) {
      const copy = settings.pageCopy[page];
      if (!copy) continue;
      source.pageCopy[page] = Object.fromEntries(keys.filter(key => copy[key] != null).map(key => [key, text(copy[key], `pageCopy.${page}.${key}`)]));
      if (page === 'company' && copy.approachBody != null) source.pageCopy[page].approachBody = list(copy.approachBody, 'pageCopy.company.approachBody');
      if (page === 'company') for (const [key, fields, count] of [['values', ['title', 'body'], 3], ['processSteps', ['title', 'note'], 3], ['processDetails', ['title', 'body'], 2]]) if (copy[key] != null) source.pageCopy[page][key] = copyList(copy[key], `pageCopy.company.${String(key)}`, fields, count);
      if (page === 'contact' && copy.faq != null) source.pageCopy.contact.faq = copyList(copy.faq, 'pageCopy.contact.faq', ['question', 'answer']);
    }
  }
  if (founders[0]) {
    const doc = founders[0];
    source.founder = {
      ...published, name: text(doc.name, 'founder.name'), role: text(doc.role, 'founder.role'),
      intro: text(doc.intro, 'founder.intro'), bio: list(doc.bio, 'founder.bio'), facts: list(doc.facts ?? [], 'founder.facts'),
      career: list(doc.career ?? [], 'founder.career'), shortBio: optional(doc.shortBio, 'founder.shortBio'),
      credentials: (doc.credentials ?? []).map(item => ({ qualification: text(item.qualification, 'credential.qualification'), institution: text(item.institution, 'credential.institution') })),
      portrait: image(doc.portrait, 'founder.portrait'),
    };
  }
  for (const doc of documents.filter(item => item._type === 'publication')) {
    const id = text(doc._id, 'publication.id');
    if (!['article', 'talk', 'podcast'].includes(doc.format)) throw new Error(`CMS: ${id} has an unsupported format.`);
    const local = doc.destinationKind === 'local';
    if (!local && doc.destinationKind !== 'external') throw new Error(`CMS: ${id} needs a destination.`);
    const slug = local ? text(doc.slug?.current ?? doc.slug, `${id}.slug`) : undefined;
    if (local && !safeSlug(slug)) throw new Error(`CMS: ${id} has an unsafe slug.`);
    source.insights.push({
      ...published, id, type: doc.format, title: text(doc.title, `${id}.title`), summary: text(doc.summary, `${id}.summary`),
      topics: list(doc.topics ?? [], `${id}.topics`), date: optional(doc.date, `${id}.date`),
      order: doc.order == null ? undefined : Number(doc.order),
      attribution: { name: text(doc.attributionName, `${id}.attributionName`), role: doc.format === 'article' ? 'author' : 'speaker' },
      host: optional(doc.host, `${id}.host`), sourceUrl: https(doc.sourceUrl, `${id}.sourceUrl`),
      sourceVerified: doc.sourceVerified === true, reuseApproved: doc.reuseApproved === true, featured: doc.featured === true,
      destination: local ? { kind: 'local', slug, body: list(doc.body, `${id}.body`) } : { kind: 'external', url: https(doc.externalUrl, `${id}.externalUrl`) },
      media: image(doc.media, `${id}.media`),
    });
  }
  for (const doc of documents.filter(item => ['venture', 'podcastReference'].includes(item._type))) {
    const reference = { ...published, id: doc._id, label: text(doc.label, `${doc._id}.label`), description: text(doc.description, `${doc._id}.description`), url: https(doc.url, `${doc._id}.url`), sourceVerified: doc.sourceVerified === true };
    if (doc._type === 'venture') source.ventures.push(reference);
    else source.references.push({ ...reference, type: 'podcast' });
  }
  source.engagements = documents.filter(item => item._type === 'engagement').map(doc => ({ ...published, id: doc._id, title: text(doc.title, `${doc._id}.title`), description: text(doc.description, `${doc._id}.description`) }));
  // The public sanitizer is also a build validator here: never silently drop a bad published document.
  const snapshot = preparePublicContent(source);
  for (const key of ['insights', 'ventures', 'references', 'engagements']) {
    if (snapshot[key].length !== source[key].length) throw new Error(`CMS: a published ${key} record failed publication validation. Check source verification, dates, media rights and required fields.`);
  }
  if (source.founder && !snapshot.founder) throw new Error('CMS: founder profile failed publication validation.');
  if (source.founder?.portrait && !snapshot.founder?.portrait) throw new Error('CMS: the founder portrait requires permission and a safe source.');
  const slugs = source.insights.filter(item => item.destination.kind === 'local').map(item => item.destination.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error('CMS: article slugs must be unique.');
  for (const item of source.insights) {
    if (item.order !== undefined && (!Number.isFinite(item.order) || !Number.isInteger(item.order) || item.order < 0)) throw new Error(`CMS: ${item.id} needs a non-negative integer order.`);
    if (item.topics.some(topic => !['strategy', 'risk', 'economics'].includes(topic))) throw new Error(`CMS: ${item.id} has an unsupported topic.`);
    if (item.media && !snapshot.insights.find(record => record.id === item.id)?.media) throw new Error(`CMS: ${item.id} media requires permission, a safe source and alt text.`);
  }
  return source;
}

export async function loadContentSource(defaults, env = process.env, fetcher = fetch) {
  const mode = env.CONTENT_MODE || 'local';
  if (mode === 'local') return defaults;
  if (mode !== 'sanity') throw new Error('CONTENT_MODE must be local or sanity.');
  const project = env.SANITY_PROJECT_ID;
  const dataset = env.SANITY_DATASET;
  if (!project || !/^[a-z0-9]+$/.test(project) || !dataset || !/^[a-z0-9_-]+$/.test(dataset)) throw new Error('CMS configuration requires a valid SANITY_PROJECT_ID and SANITY_DATASET.');
  const url = new URL(`https://${project}.api.sanity.io/v2025-02-19/data/query/${dataset}`);
  url.searchParams.set('perspective', 'published');
  url.searchParams.set('query', CMS_QUERY.replace(/\$types/g, JSON.stringify(TYPES)));
  // Asset URLs are resolved server-side; tokens never enter the generated snapshot.
  url.searchParams.set('query', url.searchParams.get('query') + '{...,media{...,"assetUrl":asset->url},portrait{...,"assetUrl":asset->url}}');
  let response;
  try {
    response = await fetcher(url, { headers: env.SANITY_READ_TOKEN ? { Authorization: `Bearer ${env.SANITY_READ_TOKEN}` } : {}, signal: AbortSignal.timeout(15000), cache: 'no-store' });
  } catch { throw new Error('CMS connection failed. Build stopped; the last successful deployment remains live.'); }
  if (!response.ok) throw new Error(`CMS query failed (${response.status}). Build stopped without using local content.`);
  let payload;
  try { payload = await response.json(); } catch { throw new Error('CMS returned invalid JSON.'); }
  return mapPublishedDocuments(payload.result, defaults);
}

