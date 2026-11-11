'use client';
/* oxlint-disable react/react-compiler -- Hydration reads URL and motion preferences before configuring the canvas. */
/* oxlint-disable next/no-img-element -- The pre-sized local sky is the SSR placeholder for the canvas scene. */

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { Button } from '@/components/ui/button';
import { DEFAULT_INTRO, findIntro, INTRO_DEFINITIONS } from '../intro/registry';
import type { IntroId } from '../intro/types';
import { HAND_DIRECTIONS } from '../hand-motion';
import { assetUrl } from '../asset-url';
import { pageCopy } from './content';
import { PageShell } from './page-shell';
import { HeroArtworkBoundary } from './hero-artwork-boundary';
import { BrandMarquee } from './brand-marquee';
import { HomeSectionsInView } from './home-sections-in-view';
import { BookingLink } from './booking';
import {
  ClockworkStory,
  requestClockworkAdvance,
  navigateClockwork,
} from './clockwork-story';
import { SilverGeometry } from './silver-geometry';
import './silver-landing.css';
import './reference-hero.css';

const HeroArt = lazy(() => import('./reference-hero-art'));
const WarmPlaceholder = () => (
  <div className="reference-composition" aria-hidden="true" />
);

export default function HeroSection({ children }: { children: ReactNode }) {
  const [intro, setIntro] = useState(true);
  const [introId, setIntroId] = useState<IntroId>(DEFAULT_INTRO);
  const [compare, setCompare] = useState(false);
  const [configured, setConfigured] = useState(false);
  const definition = findIntro(introId);
  const [skipIntro, setSkipIntro] = useState(false);
  const [replay, setReplay] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const pendingFragment = useRef('');
  const copyRef = useRef<HTMLElement>(null);
  const animate = !reduced && motionOverride !== false;
  useEffect(() => {
    document.documentElement.dataset.siteMotionPaused = String(!animate);
    document.dispatchEvent(
      new CustomEvent('site-motion-change', { detail: { paused: !animate } }),
    );
    return () => { delete document.documentElement.dataset.siteMotionPaused; };
  }, [animate]);
  const finishIntro = useCallback(() => {
    setIntro(false);
  }, []);
  useEffect(() => {
    const syncMotion = (event: Event) => {
      const paused = (event as CustomEvent<{ paused?: boolean }>).detail
        ?.paused;
      if (typeof paused === 'boolean') setMotionOverride(!paused);
    };
    document.addEventListener('clockwork-motion-toggle', syncMotion);
    return () =>
      document.removeEventListener('clockwork-motion-toggle', syncMotion);
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    const query = new URLSearchParams(window.location.search);
    // Returning through site navigation continues the page; the first-visit
    // currency introduction must not replace the persistent nav surface.
    try {
      const navigation = Number(sessionStorage.getItem('ppi-home-navigation') || 0);
      sessionStorage.removeItem('ppi-home-navigation');
      if (Date.now() - navigation < 10000) {
        setSkipIntro(true);
        setIntro(false);
      }
    } catch {}
    pendingFragment.current = window.location.hash;
    const requested = query.get('intro');
    setIntroId(
      requested === 'original'
        ? 'original'
        : (findIntro(requested)?.id ?? DEFAULT_INTRO),
    );
    setCompare(query.get('compare') === '1');
    if (media.matches) {
      setSkipIntro(true);
      setIntro(false);
    }
    // Old review links used scene=1. They must no longer silently skip the opening.
    if (query.has('scene')) {
      query.delete('scene');
      window.history.replaceState(
        null,
        '',
        window.location.pathname + '?' + query.toString(),
      );
    }
    setConfigured(true);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    if (!intro) {
      // A section link can change while the introduction is still running.
      const fragment = window.location.hash;
      pendingFragment.current = '';
      if (!fragment || fragment === '#top') {
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      const frame = requestAnimationFrame(() => {
        if (navigateClockwork(fragment)) return;
        try {
          document
            .getElementById(decodeURIComponent(fragment.slice(1)))
            ?.scrollIntoView();
        } catch {}
      });
      return () => cancelAnimationFrame(frame);
    }
    const restoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.classList.add('pp-intro-active');
    return () => {
      document.documentElement.classList.remove('pp-intro-active');
      window.history.scrollRestoration = restoration;
    };
  }, [intro]);

  useEffect(() => {
    if (!intro || !configured) return;
    // Also cover a delayed lazy chunk; the canvas has its own asset fallback.
    const timeout = window.setTimeout(() => {
      setSkipIntro(true);
      finishIntro();
    }, 12000);
    return () => clearTimeout(timeout);
  }, [intro, configured, finishIntro]);
  const replayIntro = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setMotionOverride(true);
    setSkipIntro(false);
    setIntro(true);
    setReplay((value) => value + 1);
  };
  const selectIntro = (id: IntroId) => {
    const url = new URL(window.location.href);
    setIntroId(id);
    setSkipIntro(false);
    setIntro(true);
    setReplay((value) => value + 1);
    url.searchParams.delete('scene');
    url.searchParams.set('intro', id);
    url.searchParams.set('compare', '1');
    window.history.replaceState(null, '', url);
  };
  return (
    <PageShell
      active="/"
      hero
      entrance={intro ? 'intro' : 'ready'}
      closing={false}
      overlay={
        configured && intro && (
          <div className="intro-caption">
            <Button
              className="skip-intro"
              variant="ghost"
              onClick={() => {
                setSkipIntro(true);
                finishIntro();
              }}
            >
              Skip intro{' '}
            </Button>
          </div>
        )
      }
      beforeMain={
        compare && (
          <aside
            className="intro-lab"
            aria-label="Üç görsel yönü ve el etkileşimini karşılaştır"
          >
            <span className="lab-label">
              Pretty Penny <span>Art direction / 03</span>
            </span>
            <div className="lab-options">
              {INTRO_DEFINITIONS.map((item, index) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="lab-choice"
                  aria-pressed={introId === item.id}
                  onClick={() => selectIntro(item.id)}
                  title={
                    item.description + ' — ' + HAND_DIRECTIONS[item.id].name
                  }
                >
                  <span className="lab-number">0{index + 1}</span>
                  {item.shortTitle}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="lab-replay"
              onClick={replayIntro}
              aria-label="Seçili animasyonu tekrar oynat"
            >
              <span>Tekrar</span>
            </Button>
            <a
              className="lab-close"
              href={assetUrl('')}
              aria-label="Karşılaştırmayı kapat, mevcut sürüme dön"
            >
              Kapat <span aria-hidden="true">×</span>
            </a>
          </aside>
        )
      }
    >
      <ClockworkStory intro={intro} animate={animate} heroStyle="warm">
        <SilverGeometry />
        <link
          rel="preload"
          as="fetch"
          href={assetUrl('models/pretty-penny-ornament-classic.glb')}
          crossOrigin="anonymous"
        />
        <section
          id="introduction"
      tabIndex={-1}
          data-section="introduction"
          data-direction={introId}
          data-atmosphere="reference"
          data-reference-hero
          className={
            'hero ' +
            (intro ? 'intro-running' : 'scene-ready') +
            (animate ? '' : ' motion-paused')
          }
          aria-label="Pretty Penny Intelligence introduction"
        >
          <div className="artwork" data-layout="contained">
            {configured ? (
              <HeroArtworkBoundary
                key={introId + replay}
                onFailure={finishIntro}
              >
                <Suspense fallback={<WarmPlaceholder />}>
                  <HeroArt
                    animate={animate}
                    skipIntro={skipIntro}
                    onIntroComplete={finishIntro}
                    definition={definition}
                  />
                </Suspense>
              </HeroArtworkBoundary>
            ) : (
              <WarmPlaceholder />
            )}
          </div>
          <section
            ref={copyRef}
            data-copy-reveal="complete" data-ascii="skip"
            className={'hero-title t-stagger' + (intro ? '' : ' is-shown')}
            aria-labelledby="hero-heading"
          >
            <h1 id="hero-heading">
              {pageCopy.home?.heading &&
              pageCopy.home.heading !== 'Make every penny count.' ? (
                <span className="t-stagger-line t-stagger-line--2">
                  {pageCopy.home.heading}
                </span>
              ) : (
                <>
                  <span className="t-stagger-line t-stagger-line--2">
                    Make every
                  </span>{' '}
                  <em className="t-stagger-line t-stagger-line--3">
                    penny count.
                  </em>
                </>
              )}
            </h1>
            <div
              className="hero-booking"
              aria-label="Book an introductory call"
            >
              <div className="hero-booking-actions">
                <BookingLink className="hero-booking-link">
                  <span data-copy-cta-text>
                    Book a call
                  </span>
                </BookingLink>
              </div>
            </div>
          </section>
          <a
            className="hero-explore-link hero-scroll-link"
            href="#inside-the-penny"
            onClick={(event) => requestClockworkAdvance(event, 'scroll-link')}
          >
            <span>Scroll down</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 4v15M5 12l7 7 7-7M5 22h14"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
            </svg>
          </a>
          <div
            className="hero-scene-controls"
            inert={intro}
            aria-hidden={intro}
          >
            <Button
              variant="ghost"
              onClick={replayIntro}
              aria-label="Replay introduction"
            >
              <span>Replay</span>
            </Button>
          </div>
          <output className="sr-only" aria-live="polite">
            {intro && configured
              ? 'Introducing Pretty Penny Intelligence. You can skip the introduction.'
              : 'The hero is ready.'}
          </output>
          <noscript
            dangerouslySetInnerHTML={{
              __html:
                '<style>.site-home[data-entrance] .site-header,.site-home[data-entrance] .site-header *,.site-home[data-entrance] .hero-title *,.site-home[data-entrance] main>*,.site-home[data-entrance] .site-footer,.site-home[data-entrance] .hero-title,.site-home[data-entrance] .brand-marquee,.hero-career-label,.hero-static-art,.hero-booking,.header-contact,.header-descriptor,.t-stagger-line{opacity:1!important;visibility:visible!important;transform:none!important;filter:none!important;animation:none!important}.hero-booking{pointer-events:auto!important}.intro-caption,.intro-loading-mark,.hero-motion-controls{display:none!important}</style>',
            }}
          />{' '}
        </section>
      </ClockworkStory>
      <div className="home-career-band"><p>Experience across leading organisations</p><BrandMarquee paused={!animate || intro} /></div>
      {children}
      <HomeSectionsInView />
    </PageShell>
  );
}
