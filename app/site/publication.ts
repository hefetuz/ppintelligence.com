import type {
  ContentSource,
  ExternalReference,
  Insight,
  PageCopy,
  PublicContent,
  PublicInsight,
  Publication,
  TopicId,
} from './content-types';

export const safeSlug = (value: string) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const approved = (record: Publication) =>
  record.status === 'published' && record.companyApproved === true;
const text = (value: string) =>
  typeof value === 'string' && value.trim().length > 0;
const body = (value: string[]) =>
  Array.isArray(value) && value.length > 0 && value.every(text);
const topics: TopicId[] = ['strategy', 'risk', 'economics'];
export function safeHttps(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !!url.hostname
    );
  } catch {
    return false;
  }
}
function validDate(value: string) {
  if (!/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(value)) return false;
  const full = value.length === 4 ? `${value}-01-01` : value.length === 7 ? `${value}-01` : value;
  const date = new Date(full + 'T00:00:00Z');
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === full
  );
}
function safeMedia(value: string) {
  return (
    safeHttps(value) ||
    (/^\/(?!\/)[a-zA-Z0-9/_ .-]+$/.test(value) &&
      !value.split('/').some((part) => part === '..'))
  );
}
function publishableReference(record: ExternalReference) {
  return (
    approved(record) &&
    record.sourceVerified &&
    text(record.id) &&
    text(record.label) &&
    text(record.description) &&
    safeHttps(record.url)
  );
}
const publicReference = (record: ExternalReference) => ({
  id: record.id,
  label: record.label,
  description: record.description,
  url: record.url,
});
const safeEmail = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
function publicCopy(source: PageCopy = {}): PageCopy {
  const company = source.company,
    contact = source.contact;
  const strings = (
    input: Record<string, unknown> | undefined,
    keys: string[],
  ) =>
    Object.fromEntries(
      keys
        .filter((key) => text(input?.[key] as string))
        .map((key) => [key, input![key]]),
    );
  return {
    home: strings(source.home, ['heading', 'description']),
    company: {
      ...strings(company, [
        'heading',
        'description',
        'approachHeading',
        'processHeading',
      ]),
      ...(company?.approachBody && body(company.approachBody)
        ? { approachBody: [...company.approachBody] }
        : {}),
      ...(company?.values?.length === 3 &&
      company.values.every((item) => text(item.title) && text(item.body))
        ? { values: company.values.map(({ title, body }) => ({ title, body })) }
        : {}),
      ...(company?.processSteps?.length === 3 &&
      company.processSteps.every((item) => text(item.title) && text(item.note))
        ? {
            processSteps: company.processSteps.map(({ title, note }) => ({
              title,
              note,
            })),
          }
        : {}),
      ...(company?.processDetails?.length === 2 &&
      company.processDetails.every(
        (item) => text(item.title) && text(item.body),
      )
        ? {
            processDetails: company.processDetails.map(({ title, body }) => ({
              title,
              body,
            })),
          }
        : {}),
    },
    contact: {
      ...strings(contact, ['heading', 'description']),
      ...(contact?.faq?.length &&
      contact.faq.length <= 10 &&
      contact.faq.every((item) => text(item.question) && text(item.answer))
        ? {
            faq: contact.faq.map(({ question, answer }) => ({
              question,
              answer,
            })),
          }
        : {}),
    },
  };
}
function publishableInsight(record: Insight) {
  if (
    !approved(record) ||
    !record.sourceVerified ||
    !safeHttps(record.sourceUrl) ||
    (record.date !== undefined && !validDate(record.date)) ||
    !text(record.title) ||
    !text(record.summary) ||
    !text(record.attribution.name)
  )
    return false;
  if (!['article', 'talk', 'podcast'].includes(record.type)) return false;
  if (
    record.type !== 'article' &&
    ((record.date && record.date > new Date().toISOString().slice(0, 10)) ||
      record.attribution.role !== 'speaker')
  )
    return false;
  if (record.type === 'article' && record.attribution.role !== 'author')
    return false;
  if (record.destination.kind === 'external')
    return safeHttps(record.destination.url);
  return (
    record.reuseApproved &&
    safeSlug(record.destination.slug) &&
    body(record.destination.body)
  );
}

/** The build-time boundary. Only these explicitly selected fields reach browser/HTML output. */
export function preparePublicContent(source: ContentSource): PublicContent {
  const founder = source.founder;
  return {
    pageCopy: publicCopy(source.pageCopy),
    socialLinks: Object.fromEntries(
      ['substack', 'personalLinkedIn', 'x', 'podcast']
        .filter((key) =>
          safeHttps(
            source.socialLinks?.[key as keyof typeof source.socialLinks] ?? '',
          ),
        )
        .map((key) => [
          key,
          source.socialLinks![key as keyof typeof source.socialLinks],
        ]),
    ),
    founder:
      founder &&
      approved(founder) &&
      text(founder.name) &&
      text(founder.role) &&
      text(founder.intro) &&
      body(founder.bio)
        ? {
            name: founder.name,
            role: founder.role,
            intro: founder.intro,
            bio: [...founder.bio],
            facts: founder.facts.filter(text),
            ...(founder.career?.some(text)
              ? { career: [...new Set(founder.career.filter(text))] }
              : {}),
            ...(founder.shortBio && text(founder.shortBio)
              ? { shortBio: founder.shortBio }
              : {}),
            ...(founder.credentials?.some(
              (item) => text(item.qualification) && text(item.institution),
            )
              ? {
                  credentials: founder.credentials
                    .filter(
                      (item) =>
                        text(item.qualification) && text(item.institution),
                    )
                    .map(({ qualification, institution }) => ({
                      qualification,
                      institution,
                    })),
                }
              : {}),
            ...(founder.portrait?.reuseApproved &&
            safeMedia(founder.portrait.src) &&
            text(founder.portrait.alt)
              ? {
                  portrait: {
                    src: founder.portrait.src,
                    alt: founder.portrait.alt,
                  },
                }
              : {}),
          }
        : null,
    logos: (source.logos ?? [])
      .filter(
        (item) =>
          approved(item) &&
          item.sourceVerified &&
          text(item.id) &&
          text(item.name) &&
          ['client', 'previous-employer'].includes(item.relationship) &&
          item.image?.reuseApproved &&
          safeMedia(item.image.src) &&
          text(item.image.alt),
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        relationship: item.relationship,
        image: { src: item.image.src, alt: item.image.alt },
      })),
    ventures: (source.ventures ?? [])
      .filter(publishableReference)
      .map(publicReference),
    references: (source.references ?? [])
      .filter((item) => item.type === 'podcast' && publishableReference(item))
      .map((item) => ({ ...publicReference(item), type: 'podcast' as const })),
    topics: source.topics.map((item) => ({
      id: item.id,
      number: item.number,
      name: item.name,
      word: item.word,
      lead: item.lead,
      summary: item.summary,
      question: item.question,
      figure: item.figure,
    })),
    expertise: source.expertise
      .filter(
        (item) =>
          approved(item) &&
          text(item.name) &&
          body(item.body) &&
          item.scope.every(text) &&
          (!item.slug || safeSlug(item.slug)),
      )
      .map((item) => ({
        id: item.id,
        ...(item.slug ? { slug: item.slug } : {}),
        name: item.name,
        summary: item.summary,
        body: [...item.body],
        scope: [...item.scope],
      })),
    insights: source.insights
      .filter(publishableInsight)
      .sort(
        (a, b) =>
          (a.order ?? 999) - (b.order ?? 999) ||
          (b.date ?? '').localeCompare(a.date ?? ''),
      )
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        summary: item.summary,
        topics: [
          ...new Set(item.topics.filter((topic) => topics.includes(topic))),
        ],
        ...(item.date ? { date: item.date } : {}),
        ...(item.order !== undefined ? { order: item.order } : {}),
        attribution: {
          name: item.attribution.name,
          role: item.attribution.role,
        },
        ...(item.host ? { host: item.host } : {}),
        sourceUrl: item.sourceUrl,
        featured: item.featured === true,
        destination:
          item.destination.kind === 'external'
            ? { kind: 'external', url: item.destination.url }
            : {
                kind: 'local',
                slug: item.destination.slug,
                body: [...item.destination.body],
              },
        ...(item.media?.reuseApproved && safeMedia(item.media.src)
          ? { media: { src: item.media.src, alt: item.media.alt } }
          : {}),
      })),
    team: source.team
      .filter(
        (item) =>
          approved(item) &&
          text(item.name) &&
          text(item.role) &&
          text(item.specialty),
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        role: item.role,
        specialty: item.specialty,
        ...(item.bio ? { bio: item.bio } : {}),
        ...(item.image?.reuseApproved && safeMedia(item.image.src)
          ? { image: { src: item.image.src, alt: item.image.alt } }
          : {}),
      })),
    engagements: source.engagements
      .filter(
        (item) => approved(item) && text(item.title) && text(item.description),
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      })),
    contact: {
      bookingUrl: safeHttps(source.contact.bookingUrl)
        ? source.contact.bookingUrl
        : '',
      companyLinkedIn: safeHttps(source.contact.companyLinkedIn)
        ? source.contact.companyLinkedIn
        : '',
      durationMinutes: source.contact.durationMinutes,
      participant: source.contact.participant,
      mode: source.contact.mode,
      ...(source.contact.emailApproved && safeEmail(source.contact.email)
        ? { email: source.contact.email }
        : {}),
    },
  };
}
export const featuredInsights = (records: PublicInsight[]) =>
  records.filter((item) => item.featured).slice(0, 3);
export const relatedInsights = (
  records: PublicInsight[],
  topic: TopicId,
  excludedId?: string,
) =>
  records
    .filter((item) => item.id !== excludedId && item.topics.includes(topic))
    .slice(0, 3);
export const insightTopics = (records: PublicInsight[]) =>
  topics.filter((topic) => records.some((item) => item.topics.includes(topic)));
