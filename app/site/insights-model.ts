import type { PublicInsight } from './content-types';
import type { SpeakingRecord } from './deniz-insights';

export type InsightKind = 'writing' | 'interview' | 'essay' | 'academic' | 'speaking' | 'podcast';
export type InsightFilters = { query: string; kind: InsightKind | 'all'; year: string; publisher?: string };
export type SpeakingFormat = 'all' | 'conference' | 'media';
export function speakingFormat(record: SpeakingRecord): Exclude<SpeakingFormat, 'all'> {
  return record.format ?? 'conference';
}
export function publicationPublisher(record: PublicInsight): string {
  const host = record.host || '';
  if (/cefpro|connect magazine|infront/i.test(host)) return 'CeFPro';
  if (/garp/i.test(host)) return 'GARP';
  if (/gfmi/i.test(host)) return 'GFMI';
  if (/moody/i.test(host)) return 'Moody’s Analytics';
  if (/studies in economics/i.test(host)) return 'Academic research';
  if (/linkedin/i.test(host)) return 'LinkedIn';
  if (/substack/i.test(host)) return 'Substack';
  if (record.destination.kind === 'local') return 'Pretty Penny';
  return host || 'Other publications';
}
export const insightKinds: { value: InsightKind | 'all'; label: string }[] = [
  { value: 'all', label: 'All content' }, { value: 'writing', label: 'Writing' },
  { value: 'interview', label: 'Interviews' }, { value: 'essay', label: 'Essays' },
  { value: 'academic', label: 'Academic' }, { value: 'speaking', label: 'Speaking' },
  { value: 'podcast', label: 'Podcasts' },
];

const knownDates: Record<string, string> = {
  'model-risk-lessons': '2022-07-08', 'stress-testing-ecl': '2022-03-11',
  bitcoin: '2022-07-20', 'heloc-threat': '2015-07-15', 'cecl-reserves': '2017-12-25',
  'markov-portfolios': '2013-09-30',
};
export const publicationDate = (record: PublicInsight) => record.date || knownDates[record.id];
export function publicationKind(record: PublicInsight): InsightKind {
  if (record.type === 'talk') return 'speaking';
  if (record.type === 'podcast') return 'podcast';
  if (record.id === 'business-strategy-chess') return 'essay';
  if ((record.host || '').includes('Studies in Economics')) return 'academic';
  if (['connect-career-curiosity', 'gfmi-data-interview', 'cefpro-talking-heads', 'cefpro-outlook-2025'].includes(record.id)) return 'interview';
  return 'writing';
}
export function dateLabel(date?: string) {
  if (!date) return 'Date not listed';
  if (/^\d{4}$/.test(date)) return date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', ...(date.length > 7 ? { day: 'numeric' as const } : {}), timeZone: 'UTC',
  }).format(new Date(`${date.length === 7 ? `${date}-01` : date}T00:00:00Z`));
}
const normalized = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function matchesInsight(record: { title: string; summary: string; date?: string; kind: InsightKind; terms?: string; publisher?: string }, filters: InsightFilters) {
  if (filters.publisher && filters.publisher !== 'all' && filters.publisher !== record.publisher) return false;
  if (filters.kind !== 'all' && record.kind !== filters.kind) return false;
  if (filters.year !== 'all' && (filters.year === 'undated' ? Boolean(record.date) : record.date?.slice(0, 4) !== filters.year)) return false;
  const haystack = normalized(`${record.title} ${record.summary} ${record.terms || ''}`);
  return normalized(filters.query).trim().split(/\s+/).filter(Boolean).every(term => haystack.includes(term));
}
export function sortDatedFirst<T extends { date?: string }>(records: T[]): T[] {
  return [...records].sort((a, b) => {
    if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0;
    return b.date.localeCompare(a.date);
  });
}
export function publicationAction(record: PublicInsight): string {
  if (record.destination.kind === 'local') return 'Read essay';
  const url = record.destination.url;
  if (record.id === 'cefpro-talking-heads') return 'View magazine archive';
  if (url.includes('linkedin.com/posts/')) return 'View LinkedIn reference';
  if (record.id === 'gfmi-data-interview' || record.id === 'cefpro-outlook-2025') return 'View interview reference';
  if (publicationKind(record) === 'academic') return 'View research';
  return 'Read article';
}
export function speakingMatch(record: SpeakingRecord, filters: InsightFilters) {
  return matchesInsight({ ...record, kind: 'speaking', terms: `${record.event} ${record.role}` }, filters);
}
