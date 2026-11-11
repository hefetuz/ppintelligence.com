import type { PublicExpertise, PublicInsight } from './content-types';
import { insights } from './content';
import { InsightCard } from './cards';
import { PageShell } from './page-shell';
import { SectionLabel, TextLink } from './shared';
import { siteHref } from './links';
import './insight-article.css';

export function ExpertiseDetailPage({ record }: { record: PublicExpertise }) {
  const related = insights
    .filter((item) => item.topics.includes(record.id))
    .slice(0, 3);
  return (
    <PageShell
      active="/expertise/"
      path={record.slug ? `/expertise/${record.slug}/` : '/#expertise-heading'}
    >
      <article className="detail-article section-wrap">
        <TextLink href={siteHref('/#expertise-heading')}>
          All expertise
        </TextLink>
        <SectionLabel number="01">Expertise</SectionLabel>
        <h1>{record.name}</h1>
        <p className="detail-lead">{record.summary}</p>
        <div className="reading-copy">
          {record.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        {record.scope.length > 0 && (
          <ul className="capability-list">
            {record.scope.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </article>
      {related.length > 0 && (
        <section className="related-section section-wrap">
          <h2 className="editorial-heading">Related thinking.</h2>
          <div className="insight-grid">
            {related.map((item) => (
              <InsightCard key={item.id} record={item} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
export function InsightDetailPage({ record }: { record: PublicInsight }) {
  if (record.destination.kind !== 'local') return null;
  const related = insights
    .filter(
      (item) =>
        item.id !== record.id &&
        item.topics.some((topic) => record.topics.includes(topic)),
    )
    .slice(0, 3);
  return (
    <PageShell
      active="/insights/"
      path={`/insights/${record.destination.slug}/`}
    >
      <article className="detail-article section-wrap insight-reading">
        <TextLink href={siteHref('/insights/')}>All insights</TextLink>
        <SectionLabel number={record.type === 'article' ? 'A' : 'T'}>
          {record.type === 'article' ? 'Article' : 'Past talk / seminar'}
        </SectionLabel>
        <h1>{record.title}</h1>
        <p className="detail-lead">{record.summary}</p>
        <p className="insight-attribution">
          {record.attribution.role === 'author' ? 'Author' : 'Speaker'}:{' '}
          {record.attribution.name}
          {record.date && (
            <>
              {' '}
              · <time dateTime={record.date}>{record.date}</time>
            </>
          )}
          {record.host && ` · ${record.host}`}
        </p>
        <div className="reading-copy">
          {record.destination.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        {record.sourceUrl && <TextLink href={record.sourceUrl} external>
          Original source
        </TextLink>}
      </article>
      {related.length > 0 && (
        <section className="related-section section-wrap">
          <h2 className="editorial-heading">Keep thinking.</h2>
          <div className="insight-grid">
            {related.map((item) => (
              <InsightCard key={item.id} record={item} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
