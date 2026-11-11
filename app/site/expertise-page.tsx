'use client';
import { useEffect } from 'react';
import { legacyExpertiseTarget } from './routes';
import { siteHref } from './links';

/** Compatibility only: the Expertise composition now lives on Home. */
export function ExpertisePage() {
  useEffect(() => {
    window.location.replace(
      siteHref(legacyExpertiseTarget(window.location.hash)),
    );
  }, []);
  return (
    <main className="expertise-redirect section-wrap">
      <h1>Our expertise is now on the homepage.</h1>
      <p>
        <a href={siteHref('/#expertise-heading')}>
          Explore our connected expertise{' '}
        </a>
      </p>
    </main>
  );
}
