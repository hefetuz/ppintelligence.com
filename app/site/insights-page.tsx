'use client';
import { useEffect, useState } from 'react';
import { ChevronDownIcon, FileText, Headphones, Mic, SearchIcon } from '../../components/sharp-icons';
import { insights as publishedInsights, cmsManaged, editorialSpeaking } from './content';
import type { PublicInsight } from './content-types';
import { insightHref } from './cards';
import { siteHref } from './links';
import { PageShell } from './page-shell';
import { additionalPublications, chessEssay, type SpeakingRecord } from './deniz-insights';
import { InsightFeatureCard, InsightsLatest, type LatestItem } from './insights-latest';
import {
  dateLabel, insightKinds, matchesInsight, publicationAction, publicationDate,
  publicationKind, publicationPublisher, sortDatedFirst, speakingFormat, speakingMatch,
  type InsightFilters, type SpeakingFormat,
} from './insights-model';
import './insights-library.css';
import { InsightsNewsletter } from './insights-newsletter';

type View = 'writing' | 'speaking' | 'podcasts';
type EngagementStatus = 'all' | SpeakingRecord['status'];
const views = [
  { value: 'writing', label: 'Writing', hash: 'publications', icon: FileText },
  { value: 'speaking', label: 'Speaking', hash: 'speaking', icon: Mic },
  { value: 'podcasts', label: 'Podcasts', hash: 'podcasts', icon: Headphones },
] as const;
const external = { target: '_blank', rel: 'noopener noreferrer' };
const hrefFor = (record: PublicInsight) => !cmsManaged && record.id === chessEssay.id
  ? record.sourceUrl
  : insightHref(record);
const emptyFilters: InsightFilters = { query: '', kind: 'all', year: 'all', publisher: 'all' };
const speakingPhotos: Record<string, NonNullable<LatestItem['image']>> = {
  'ai-model-risk-2026': { src: '/assets/insights/risk-americas-panel.webp', alt: 'Deniz Tudor with fellow panelists at CeFPro Risk Americas', mobilePosition: '14% center' },
  'experian-2024': { src: '/assets/insights/experian-vision.webp', alt: 'Deniz Tudor presenting on stage at Experian Vision 2024', position: '50% 61%' },
};

export function InsightsPage({ insights = publishedInsights }: { insights?: typeof publishedInsights } = {}) {
  const [view, setView] = useState<View>('writing');
  const [filters, setFilters] = useState<InsightFilters>(emptyFilters);
  const [status, setStatus] = useState<EngagementStatus>('all');
  const [format, setFormat] = useState<SpeakingFormat>('all');

  const resetFilters = () => {
    setFilters(emptyFilters);
    setFormat('all');
    setStatus('all');
  };
  useEffect(() => {
    const sync = () => {
      setView(views.find(item => '#' + item.hash === location.hash)?.value ?? 'writing');
      setFilters(emptyFilters);
      setFormat('all');
      setStatus('all');
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const seen = new Set<string>();
  const publications = sortDatedFirst(
    [...(cmsManaged ? [] : [chessEssay, ...additionalPublications]), ...insights.filter(record => record.type === 'article')]
      .filter(record => {
        const key = record.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(record => ({ ...record, date: cmsManaged ? record.date : publicationDate(record), publisher: publicationPublisher(record) })),
  );
  const publishers = [...new Set(publications.map(record => record.publisher))].sort();
  const visible = publications.filter(record => matchesInsight({
    ...record, kind: publicationKind(record), terms: (record.host || '') + ' ' + record.topics.join(' '),
  }, filters));
  const podcasts = sortDatedFirst(insights.filter(record => record.type === 'podcast'));
  const visiblePodcasts = podcasts.filter(record => matchesInsight({ ...record, kind: 'podcast', terms: record.host }, filters));
  const talks: SpeakingRecord[] = sortDatedFirst([
    ...editorialSpeaking,
    ...insights.filter(record => record.type === 'talk').map(record => ({
      id: record.id, title: record.title, summary: record.summary, event: record.host || 'Conversation',
      role: 'Speaker', status: 'past' as const, format: 'media' as const,
      date: record.date, href: insightHref(record), action: 'Watch video',
    })),
  ]);
  const visibleTalks = talks.filter(record =>
    (status === 'all' || record.status === status) &&
    (format === 'all' || (record.status === 'upcoming' ? record.format : speakingFormat(record)) === format) &&
    speakingMatch(record, filters),
  );
  const upcomingTalks = visibleTalks.filter(record => record.status === 'upcoming');
  const pastTalks = visibleTalks.filter(record => record.status === 'past');
  const archive = view === 'writing' ? publications : view === 'speaking' ? talks : podcasts;
  const years = [...new Set(archive.flatMap(record => record.date ? [record.date.slice(0, 4)] : []))].sort().reverse();
  const showFilters = view !== 'podcasts' || podcasts.length > 1;
  const active = Boolean(filters.query || filters.kind !== 'all' || filters.year !== 'all' ||
    filters.publisher !== 'all' || format !== 'all' || status !== 'all');
  const resultCount = view === 'writing' ? visible.length : view === 'speaking' ? visibleTalks.length : visiblePodcasts.length;
  const speakingResultLabel = status === 'all' ? 'engagement' : status === 'past' ? 'past engagement' : 'upcoming topic';
  const resultLabel = view === 'writing' ? 'publication' : view === 'speaking' ? speakingResultLabel : 'podcast';
  const speakingHighlights = talks.filter(record => record.status === 'past' && (record.media || (!cmsManaged && speakingPhotos[record.id]))).map(record => ({
    id: record.id, title: record.title, summary: record.summary, label: record.event,
    date: record.dateLabel || dateLabel(record.date), href: record.href, action: record.action || 'View event', external: true,
    image: record.media || (!cmsManaged ? speakingPhotos[record.id] : undefined),
  }));

  const selectView = (next: View, hash: string) => {
    setView(next);
    resetFilters();
    history.replaceState(null, '', siteHref('/insights/#' + hash));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <PageShell active="/insights/" closing={false}>
      <InsightsNewsletter />
      <div className="insights-page" data-ascii="skip">
        <h1 className="sr-only">Insights</h1>
        <nav className="insights-views" aria-label="Insights categories">
          {views.map(({ value, label, hash, icon: Icon }) => (
            <a key={value} href={siteHref('/insights/#' + hash)} aria-current={view === value ? 'page' : undefined}
              onClick={event => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                if (view !== value) selectView(value, hash);
              }}>
              <Icon size={16} /><span>{label}</span>
            </a>
          ))}
        </nav>

        {view === 'speaking' && <InsightsLatest title="Speaking highlights" items={speakingHighlights} />}

        <section className={'insights-collection insights-' + view} id={views.find(item => item.value === view)?.hash} aria-labelledby="insights-archive-heading">
          <header className="insights-collection__heading">
            <h2 id="insights-archive-heading">{view === 'writing' ? 'All publications' : view === 'speaking' ? 'All Speaking' : podcasts.length === 1 ? 'Latest podcast' : 'Podcasts'}</h2>
            {view === 'speaking' && <a className="action-button action-button--compact" href={siteHref('/contact/?topic=speaking')}>Invite to speak</a>}
          </header>
          {showFilters && <>
            <div className="insights-toolbar-sticky">
            <div className="insights-toolbar">
              <label className="insights-search">
                <span>Search</span>
                <span className="insights-search__field"><SearchIcon size={17} /><input type="search" value={filters.query}
                  placeholder={view === 'writing' ? 'Search publications' : view === 'speaking' ? 'Search engagements' : 'Search podcasts'}
                  onChange={event => setFilters(previous => ({ ...previous, query: event.target.value }))} /></span>
              </label>
              {view === 'writing' && <>
                <label>Publisher<select aria-label="Publisher" value={filters.publisher} onChange={event => setFilters(previous => ({ ...previous, publisher: event.target.value }))}>
                  <option value="all">All publishers</option>
                  {publishers.map(publisher => <option key={publisher}>{publisher}</option>)}
                </select></label>
                <label>Format<select aria-label="Publication format" value={filters.kind} onChange={event => setFilters(previous => ({ ...previous, kind: event.target.value as InsightFilters['kind'] }))}>
                  {insightKinds.filter(kind => !['speaking', 'podcast'].includes(kind.value)).map(kind =>
                    <option key={kind.value} value={kind.value}>{kind.value === 'all' ? 'All formats' : kind.value === 'writing' ? 'Articles' : kind.label}</option>,
                  )}
                </select></label>
              </>}
              {view === 'speaking' && <>
                <label>Format<select aria-label="Speaking format" value={format} onChange={event => setFormat(event.target.value as SpeakingFormat)}>
                  <option value="all">All formats</option>
                  <option value="conference">Conferences & keynotes</option>
                  <option value="media">Webinars & conversations</option>
                </select></label>
                <label>Status<select value={status} onChange={event => setStatus(event.target.value as EngagementStatus)}>
                  <option value="all">All</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select></label>
              </>}
              <label>Year<select value={filters.year} onChange={event => setFilters(previous => ({ ...previous, year: event.target.value }))}>
                <option value="all">All years</option>{years.map(year => <option key={year}>{year}</option>)}
                {archive.some(record => !record.date) && <option value="undated">Date not listed</option>}
              </select></label>
            </div>
            </div>
            <div className="insights-results"><output aria-live="polite">{resultCount} {resultLabel}{resultCount === 1 ? '' : 's'}</output>
              {active && <button type="button" onClick={resetFilters}>Clear filters</button>}
            </div>
          </>}

          {view === 'writing' && <>
            <div className="insights-list">{visible.map((record, index) => <article className="insights-entry" key={record.id}>
              {!record.date && (index === 0 || visible[index - 1].date) && <p className="insights-undated">Publication date not listed</p>}
              <a className="insights-entry__link" href={hrefFor(record)} {...(hrefFor(record).startsWith('https://') ? external : {})}>
                <span className="insights-entry__date">{record.date && <time dateTime={record.date}>{dateLabel(record.date)}</time>}</span>
                <div className="insights-entry__body"><h3>{record.title}</h3><span className="insights-entry__publisher">{record.host}</span></div>
                <span className="insights-entry__action"><span className="sr-only">{publicationAction(record)}</span><span aria-hidden="true">{hrefFor(record).startsWith('https://') ? '↗' : '→'}</span></span>
              </a>
            </article>)}</div>
            {visible.length === 0 && <p className="insights-empty">No publications match. Try another search or clear the filters.</p>}
          </>}

          {view === 'speaking' && <>
            {upcomingTalks.length > 0 && <section className="insights-forthcoming" aria-labelledby="insights-upcoming-heading">
              <h3 id="insights-upcoming-heading">Upcoming</h3>
              <p>Event dates and hosts have yet to be announced.</p>
              <ul>{upcomingTalks.map(record => <li key={record.id}>{record.title}</li>)}</ul>
            </section>}
            {pastTalks.length > 0 && <div className="insights-list">{pastTalks.map((record, index) => <div key={record.id}>
              {(index === 0 || record.date?.slice(0, 4) !== pastTalks[index - 1].date?.slice(0, 4)) && <h3 className="insights-year-heading">{record.date?.slice(0, 4) || 'Date not listed'}</h3>}
              <article className="insights-talk">
                <span className="insights-entry__date">{record.date && (record.dateLabel || dateLabel(record.date))}</span>
                <details className="insights-talk__details">
                  <summary><span className="insights-talk__heading"><span className="insights-talk__title">{record.title}</span><span className="insights-entry__publisher">{record.event} · {record.role}</span></span><ChevronDownIcon className="insights-talk__toggle" size={16} /></summary>
                  <div className="insights-talk__content"><p>{record.summary}</p>{record.href && <a href={record.href} {...external}>{record.action || 'View event'} <span aria-hidden="true">↗</span></a>}</div>
                </details>
              </article>
            </div>)}</div>}
            {visibleTalks.length === 0 && <p className="insights-empty">No speaking engagements match. Try another search or clear the filters.</p>}
          </>}

          {view === 'podcasts' && <>
            <div className="insights-podcast-list">{visiblePodcasts.map((record, index) => (
              <InsightFeatureCard key={record.id} className="insights-podcast" eager={index === 0} item={{
                id: record.id, title: record.title, summary: record.summary, label: 'Podcast',
                href: insightHref(record), action: 'Listen now', external: true,
                image: record.media || (!cmsManaged && record.id === 'uncharted-podcast' ? {
                  src: '/assets/insights/uncharted-hosts.webp', alt: 'Uncharted co-hosts Paula Fontana and Deniz Tudor',
                  position: 'right 35%', mobilePosition: 'right top',
                } : undefined),
              }} />
            ))}</div>
            {visiblePodcasts.length === 0 && <p className="insights-empty">No podcasts match. Try another search or clear the filters.</p>}
          </>}
        </section>
      </div>
    </PageShell>
  );
}
