import type { ReactNode } from 'react';
import type { BaseSitePath } from './content-types';
import { ClosingInvitation, PodcastAnnouncement, SiteFooter, SiteHeader } from './shared';
import { siteHref } from './links';
import { AnalyticsConsent } from './analytics';
import { SiteAsciiReveal } from './site-ascii-reveal';
import { NavigationContinuity } from './navigation-continuity';
import { HomeSectionAddress } from './home-section-address';
import { HomeSectionDecode } from './home-section-decode';
import './interface-system.css';
import './action-system.css';
import './surface-refinement.css';
import './apple-type-scale.css';
import './nav-morph.css';
import './interface-hardening.css';

export function PageShell({
  active,
  path = active,
  children,
  closing = true,
  hero = false,
  beforeMain,
  headerControls,
  entrance,
  overlay,
}: {
  active: BaseSitePath;
  path?: string;
  children: ReactNode;
  closing?: boolean;
  hero?: boolean;
  beforeMain?: ReactNode;
  headerControls?: ReactNode;
  entrance?: 'intro' | 'ready';
  overlay?: ReactNode;
}) {
  return (
    <div
      id="top"
      data-entrance={entrance}
      className={(hero ? 'site-home' : 'site-page') + ' replay-site'}
    >
      <a className="skip-link" href={siteHref(path + '#main-content')}>
        Skip to content
      </a>
      <aside className="palette-study-note" aria-label="Color study">
        <span>Color study · sample copy</span>
        <a data-exit-preview href={siteHref(path)}>
          View the complete black design{' '}
        </a>
      </aside>
      {beforeMain}
      <PodcastAnnouncement />
      <SiteHeader active={active} hero={hero} controls={headerControls} />
      <main id="main-content" data-ascii-boot="pending" tabIndex={-1}>
        {children}
        {closing && <ClosingInvitation />}
      </main>
      <SiteFooter />
      <AnalyticsConsent />
      <SiteAsciiReveal />
      <NavigationContinuity />
      {hero && <HomeSectionAddress />}
      {hero && <HomeSectionDecode />}
      {overlay}
    </div>
  );
}
