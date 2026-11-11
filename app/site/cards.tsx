/* oxlint-disable next/no-img-element -- Permissioned media and self-hosted SVGs support the portable presentation build. */
import type {
  PublicExpertise,
  PublicInsight,
  PublicTeamMember,
  Topic,
} from './content-types';
import { siteHref } from './links';

export function ExpertiseCard({
  topic,
  detail,
}: {
  topic: Topic;
  detail?: PublicExpertise;
}) {
  const href = detail?.slug ? `/expertise/${detail.slug}/` : `/#${topic.id}`;
  return (
    <article className={`expertise-card expertise-card--${topic.id}`}>
      <span className="card-index">
        {topic.number} / {topic.name}
      </span>
      <h3>{topic.word}</h3>
      <p>{topic.summary}</p>
      <a className="card-link" href={siteHref(href)}>
        Explore {topic.name.toLowerCase()}
      </a>
    </article>
  );
}

export const insightHref = (record: PublicInsight) =>
  record.destination.kind === 'local'
    ? siteHref(`/insights/${record.destination.slug}/`)
    : record.destination.url;
export function InsightCard({ record }: { record: PublicInsight }) {
  const external = record.destination.kind === 'external';
  return (
    <article className="insight-card">
      {record.media && (
        <img
          className="insight-media"
          src={record.media.src}
          alt={record.media.alt}
          loading="lazy"
          decoding="async"
        />
      )}
      <p className="card-index">
        {record.type === 'article' ? 'Article' : 'Past talk / seminar'}{' '}
        {record.date && (
          <>
            <span>·</span>{' '}
            <time dateTime={record.date}>
              {new Date(record.date + 'T00:00:00Z').toLocaleDateString(
                'en-GB',
                {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'UTC',
                },
              )}
            </time>
          </>
        )}
      </p>
      <h3>
        <a
          href={insightHref(record)}
          {...(external
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {record.title}
        </a>
      </h3>
      <p>{record.summary}</p>
      <p className="insight-attribution">
        {record.attribution.role === 'speaker' ? 'Speaker' : 'Author'}:{' '}
        {record.attribution.name}
        {record.host && ` · ${record.host}`}
      </p>
      <a
        className="card-link"
        href={insightHref(record)}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {external
          ? 'View original source (opens in a new tab)'
          : 'Read the piece'}
      </a>
    </article>
  );
}

export function TeamProfile({ member }: { member: PublicTeamMember }) {
  return (
    <article className="team-profile">
      {member.image && (
        <img
          src={member.image.src}
          alt={member.image.alt}
          loading="lazy"
          decoding="async"
        />
      )}
      <p className="card-index">{member.role}</p>
      <h3>{member.name}</h3>
      <p className="team-specialty">{member.specialty}</p>
      {member.bio && <p>{member.bio}</p>}
    </article>
  );
}
