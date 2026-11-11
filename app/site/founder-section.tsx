/* oxlint-disable next/no-img-element -- Optional licensed image with stable native dimensions. */
import { EmployerLogo } from './employer-logo';
import { founder as defaultFounder } from './content';
import type { PublicFounder, PublicPodcastReference } from './content-types';
import { TextLink } from './shared';
import { BookingLink } from './booking';
import { siteHref } from './links';
import { FounderArt } from './founder-art';
import { assetUrl } from '../asset-url';
import './founder-stage.css';

export function FounderSection({
  profile = defaultFounder,
  detailed = false,
  podcasts = [],
}: {
  profile?: PublicFounder | null;
  detailed?: boolean;
  podcasts?: PublicPodcastReference[];
}) {
  if (!profile) return null;
  if (!detailed)
    return (
      <section
        id="founder"
        data-section="founder"
        className="founder-section founder-stage section-wrap"
        aria-labelledby="founder-heading"
      >
        <div className="founder-screen">
          <div className="founder-atmosphere" aria-hidden="true">
            <img
              className="founder-sky"
              src={assetUrl('assets/deniz/layers/sky.webp')}
              alt=""
              width={1024}
              height={1536}
              loading="lazy"
              decoding="async"
            />
            <img
              className="founder-cloud-distant"
              src={assetUrl('assets/deniz/layers/clouds.webp')}
              alt=""
              width={1024}
              height={1536}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="founder-spread">
            <FounderArt />
            <div className="founder-dossier">
              <header className="founder-identity">
                <p className="founder-kicker">The mind behind Pretty Penny</p>
                <h2 id="founder-heading" tabIndex={-1}>
                  <span>{profile.name.split(' ').slice(0, -1).join(' ')}</span>{' '}
                  <em>{profile.name.split(' ').at(-1)}</em>
                </h2>
                <div className="founder-short-bio">
                  <p>{profile.shortBio || profile.intro}</p>
                </div>
              </header>
              <div className="founder-profile-action">
                <div className="founder-writing-primary">
                  <TextLink href={siteHref('/insights/#publications')}>
                    View publications
                  </TextLink>
                </div>
                <BookingLink className="founder-booking-secondary">
                  Book a call
                </BookingLink>
              </div>
            </div>
          </div>

        </div>
        <div className="founder-runway" aria-hidden="true" />
      </section>
    );
  const career = !detailed && profile.career?.length ? profile.career : null;
  return (
    <section
      className="founder-section section-wrap"
      aria-labelledby="founder-heading"
    >
      <div className="landing-content">
        <p className="landing-eyebrow">The founder of Pretty Penny</p>
        <div
          className={`founder-layout${profile.portrait ? ' founder-layout--portrait' : ''}`}
        >
          <div className="founder-opening">
            <h2 id="founder-heading" className="editorial-heading">
              Business judgment.
              <br />
              <em>Built on experience.</em>
            </h2>
            {profile.portrait ? (
              <figure className="founder-portrait">
                <img
                  src={profile.portrait.src}
                  alt={profile.portrait.alt}
                  width={480}
                  height={560}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            ) : (
              <p className="founder-principle">{profile.intro}</p>
            )}
          </div>
          <div className="founder-copy">
            <p className="founder-name">{profile.name}</p>
            <p className="founder-role">{profile.role}</p>
            <div className="founder-bio">
              {profile.bio
                .slice(0, detailed ? undefined : 2)
                .map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
            </div>
            {career ? (
              <div className="founder-career">
                <p>Deniz’s previous experience includes</p>
                <ul
                  className="founder-facts"
                  aria-label="Deniz Tudor’s previous career experience"
                >
                  {career.map((name) => (
                    <li key={name}><EmployerLogo name={name} /></li>
                  ))}
                </ul>
              </div>
            ) : profile.facts.length > 0 ? (
              <ul className="founder-facts" aria-label="Areas of experience">
                {profile.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            ) : null}
            {!detailed ? (
              <TextLink href={siteHref('/about/')}>Meet Deniz</TextLink>
            ) : null}
          </div>
        </div>
        {!detailed &&
          podcasts.map((podcast) => (
            <div className="founder-perspective" key={podcast.id}>
              <div>
                <p className="landing-eyebrow">
                  Podcast · A shared perspective
                </p>
                <h3>{podcast.label}</h3>
              </div>
              <p>{podcast.description}</p>
              <TextLink href={podcast.url} external>
                Explore the podcast
              </TextLink>
            </div>
          ))}
      </div>
    </section>
  );
}
