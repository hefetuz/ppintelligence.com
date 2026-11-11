'use client';
/* oxlint-disable next/no-img-element -- Self-hosted vector identity is shared with the portable build. */
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The inline relationship diagram is a labelled SVG image, not a raster asset. */

import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { assetUrl } from '../asset-url';
import {
  BOOKING_URL,
  COMPANY_LINKEDIN,
  socialLinks,
  navigation,
  type SitePath,
} from './content';
import { siteHref } from './links';
import { sitePlan } from './routes';
import { BookingLink } from './booking';
import { FooterWordmark } from './footer-wordmark';
import './mobile-navigation.css';
import { audienceHandoffState } from '../audience-handoff-model';
import {
  founderHeaderInk,
  founderTransitionState,
} from '../founder-transition-model';

export function Identity({ wordmark = true }: { wordmark?: boolean }) {
  return (
    <a
      className="identity"
      href={siteHref('/')}
      aria-label="Pretty Penny Intelligence home"
    >
      <span className="pp-mark-stack"><svg className="pp-mark pp-mark-trace" viewBox="-8 -8 747 747" aria-hidden="true"><path d="M142.821 0H387C508.321 0 592.786 43 592.786 135.143C592.786 153.571 590.482 172 586.643 187.357C672.643 195.036 731 238.036 731 324.036C731 456.107 626.571 568.214 483.75 583.571L414.643 684.929L394.679 580.5L310.214 539.036L406.964 503.714L488.357 394.679L505.25 499.107C585.107 486.821 641.929 416.179 641.929 339.393C641.929 284.107 598.929 264.143 534.429 264.143H350.143L228.821 731H139.75L281.804 184.286H502.179C503.714 175.071 503.714 165.857 503.714 156.643C503.714 101.357 469.929 79.8571 390.071 79.8571H210.393L89.0714 546.714H0L142.821 0Z" pathLength="1" fill="none" stroke="currentColor" strokeWidth="13.8" strokeLinejoin="round" /></svg>
        <img
          className="pp-mark pp-mark-solid"
          src={assetUrl('pp-logo.svg')}
          alt=""
          width={40}
          height={44}
        />
        <img
          className="pp-mark pp-mark-outline"
          src={assetUrl('pp-logo-outline.svg')}
          alt=""
          width={40}
          height={44}
        />
      </span>
      {wordmark && (
        <span className="wordmark">
          Pretty Penny<span>Intelligence</span>
        </span>
      )}
    </a>
  );
}

export function PodcastAnnouncement() {
  const [dismissed, setDismissed] = useState(false);
  const [preferenceReady, setPreferenceReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setDismissed(sessionStorage.getItem('ppi-podcast-dismissed') === 'true'); } catch {}
      setPreferenceReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!preferenceReady) return;
    document.documentElement.dataset.announcementDismissed = String(dismissed);
    window.dispatchEvent(new Event('resize'));
  }, [dismissed, preferenceReady]);
  if (!socialLinks.podcast) return null;
  if (dismissed) return null;
  return (
    <aside data-ascii="skip" className="podcast-announcement" aria-label="Podcast announcement">
      <a href={socialLinks.podcast} target="_blank" rel="noopener noreferrer">
        <span className="podcast-announcement__long">Listen to Uncharted, a podcast with Deniz Tudor.</span>
        <span className="podcast-announcement__short">Uncharted with Deniz Tudor</span>
        <strong><span className="podcast-announcement__long">Explore the podcast</span><span className="podcast-announcement__short">Listen</span></strong>
      </a>
      <button type="button" className="podcast-announcement__close" aria-label="Dismiss podcast announcement" onClick={() => {
        try { sessionStorage.setItem('ppi-podcast-dismissed', 'true'); } catch {}
        setDismissed(true);
      }}><span aria-hidden="true" /><span aria-hidden="true" /></button>
    </aside>
  );
}

export function SiteHeader({
  active,
  hero = false,
  controls,
}: {
  active: SitePath;
  hero?: boolean;
  controls?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [keyboardMenu, setKeyboardMenu] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const resize = () => { if (innerWidth > 1023) setOpen(false); };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', resize);
    };
  }, [open]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 10);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
    };
  }, []);
  useEffect(() => {
    if (!hero || !headerRef.current) return;
    const header = headerRef.current;
    const page = header.closest('.site-home');
    const founder = page?.querySelector<HTMLElement>('.founder-stage');
    const screen = founder?.querySelector<HTMLElement>('.founder-screen');
    const footer = page?.querySelector<HTMLElement>('footer');
    const story = page?.querySelector<HTMLElement>('[data-clockwork-story]');
    const audience = page?.querySelector<HTMLElement>('[data-audience-stage]');
    const audiencePaper = page?.querySelector<HTMLElement>('.audience-paper');
    const previousStyles = new Map<string, string>();
    const style = (name: string, value: string) => {
      if (previousStyles.get(name) === value) return;
      previousStyles.set(name, value);
      header.style.setProperty(name, value);
    };
    let frame = 0;
    const sample = () => {
      frame = 0;
      const line = header.getBoundingClientRect().height / 2;
      const art = screen?.getBoundingClientRect();
      const end = footer?.getBoundingClientRect();
      const audienceBox = audience?.getBoundingClientRect();
      const onAudience =
        !!audienceBox && audienceBox.top <= line && audienceBox.bottom > line;
      const onFounder =
        !!art &&
        art.top <= line &&
        art.bottom > line &&
        !(end && end.top <= line);
      const cloud = founderTransitionState(
        Number(story?.dataset.founderProgress ?? story?.dataset.progress ?? 0),
      ).cloud;
      const onFooter = !!end && end.top <= line;
      const ink = onFooter
        ? 0
        : story?.dataset.audienceHandoff === 'true' &&
            story.dataset.motion !== 'reduced'
          ? audienceHandoffState(Number(story.dataset.progress || 0)).paper
          : onFounder
            ? founder?.dataset.overlap === 'true'
              ? founderHeaderInk(cloud)
              : 1
            : onAudience
              ? 1
              : 0;
      const progress = Number(story?.dataset.progress || 0);
      const ramp = Math.max(0, Math.min(1, (progress - .2) / .18));
      const blueprint = progress < .3 && !onFounder && !onAudience ? 1 : ramp * ramp * (3 - 2 * ramp) * (1 - ink);
      // Geometry of the hidden sticky founder screen alone cannot identify the
      // active chapter. Service progress always owns a transparent header.
      const paper = onFounder && story?.dataset.audienceExit !== 'running' && (story?.dataset.audienceExit === 'complete' || founder?.dataset.overlap !== 'true' || cloud > 0.5);
      const paperElement = cloud > 0.5 && onFounder ? screen : audiencePaper;
      const paperColor = paperElement
        ? getComputedStyle(paperElement).backgroundColor
        : '#fcfcfc';
      // Complete reads before invalidating styles on the header subtree.
      style('--header-blueprint-blend', (onFooter ? 1 : blueprint).toFixed(4));
      const blueprintNav = String(progress >= 0.3 && progress < 0.94 && !onFooter && !onFounder);
      if (header.dataset.blueprintNav !== blueprintNav)
        header.dataset.blueprintNav = blueprintNav;
      style('--header-ink-progress', ink.toFixed(4));
      const surfaceName = ink > 0.5 ? 'light' : 'dark';
      const navSurface = onFooter ? 'footer' : paper ? 'paper' : 'scene';
      if (header.dataset.surface !== surfaceName)
        header.dataset.surface = surfaceName;
      if (header.dataset.navSurface !== navSurface)
        header.dataset.navSurface = navSurface;
      style('--header-paper', paperColor);
      const surface = onFooter ? 1 : paper ? ink : 0;
      style('--header-surface-opacity', surface.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sample);
    };
    let lastScene = founder?.dataset.scene;
    const observer = new MutationObserver(() => {
      if (founder?.dataset.scene !== lastScene) {
        lastScene = founder?.dataset.scene;
        schedule();
      }
    });
    if (founder)
      observer.observe(founder, {
        attributes: true,
        attributeFilter: ['data-scene'],
      });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    story?.addEventListener('clockwork-progress', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      story?.removeEventListener('clockwork-progress', schedule);
      header.style.removeProperty('--header-ink-progress');
      header.style.removeProperty('--header-surface-opacity');
    };
  }, [hero]);
  return (
    <header
      ref={headerRef}
      data-keyboard-menu={keyboardMenu || undefined}
      data-ascii="skip"
      data-menu-open={open}
      className={
        (hero ? 'hero-header site-header' : 'site-header inner-header') +
        ' has-mobile-navigation' +
        (scrolled ? ' is-scrolled' : '')
      }
    >
      <span className="site-header__frame" aria-hidden="true" />
      <span className="site-header__edge site-header__edge--left" aria-hidden="true" />
      <span className="site-header__edge site-header__edge--right" aria-hidden="true" />
      <Identity wordmark={false} />
      <nav className="desktop-nav" aria-label="Main navigation">
        {navigation
          .filter((item) => item.path !== '/' && item.path !== '/expertise/')
          .map((item) => (
            <a
              key={item.path}
              href={siteHref(item.path)}
              aria-current={active === item.path ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
      </nav>
      <BookingLink className="header-contact">Let’s talk</BookingLink>
      {controls}
      <Button ref={triggerRef} className="mobile-menu-trigger" variant="ghost"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open} aria-controls={menuId} onClick={event => { setKeyboardMenu(event.detail === 0); setOpen(value => !value); }}>
        <span className="mobile-navigation__hamburger" aria-hidden="true"><span /><span /><span /></span>
      </Button>
      <div id={menuId} className="mobile-navigation mobile-navigation--inline" aria-hidden={!open} inert={!open}>
        <div className="mobile-navigation__clip">
          <div className="mobile-navigation__body">
            <nav aria-label="Mobile navigation">
              {navigation.filter(item => item.path !== '/' && item.path !== '/expertise/').map(item => (
                <a key={item.path} href={siteHref(item.path)} aria-current={active === item.path ? 'page' : undefined} onClick={() => setOpen(false)}>{item.label}</a>
              ))}
            </nav>
            <BookingLink className="mobile-navigation__booking" onClick={() => setOpen(false)}>Let’s talk</BookingLink>
          </div>
        </div>
      </div>
    </header>
  );
}

export function ActionLink({
  children,
  href = BOOKING_URL,
  light = false,
}: {
  children: ReactNode;
  href?: string;
  light?: boolean;
}) {
  const external = href.startsWith('https://');
  if (href === BOOKING_URL)
    return (
      <BookingLink
        className={'primary-cta action-link' + (light ? ' light-cta' : '')}
      >
        {children}
      </BookingLink>
    );
  return (
    <a
      className={'primary-cta action-link' + (light ? ' light-cta' : '')}
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

export function TextLink({
  children,
  href,
  external = false,
  ariaLabel,
}: {
  children: ReactNode;
  href: string;
  external?: boolean;
  ariaLabel?: string;
}) {
  return (
    <a
      className="text-link"
      href={href}
      aria-label={ariaLabel}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

export function SectionLabel({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <p className="chapter-label">
      <span>{number}</span>
      {children}
    </p>
  );
}

export function OrbitDiagram({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={'orbit-diagram' + (compact ? ' orbit-diagram--compact' : '')}
    >
      <svg
        viewBox="0 0 520 520"
        fill="none"
        role="img"
        aria-label="Business strategy, risk management and economic analysis connected around business value"
      >
        <circle cx="260" cy="260" r="225" stroke="currentColor" opacity=".2" />
        <circle
          cx="260"
          cy="260"
          r="175"
          stroke="currentColor"
          opacity=".16"
          strokeDasharray="2 7"
        />
        <ellipse
          cx="260"
          cy="260"
          rx="220"
          ry="98"
          transform="rotate(-35 260 260)"
          stroke="currentColor"
          opacity=".5"
        />
        <ellipse
          cx="260"
          cy="260"
          rx="220"
          ry="98"
          transform="rotate(35 260 260)"
          stroke="currentColor"
          opacity=".25"
        />
        <path
          d="M260 23V38M497 260H482M260 497V482M23 260H38"
          stroke="currentColor"
        />
        <circle cx="260" cy="260" r="70" stroke="currentColor" opacity=".45" />
        <circle cx="120" cy="126" r="5" fill="currentColor" />
        <circle cx="428" cy="279" r="5" fill="currentColor" />
        <circle cx="163" cy="424" r="5" fill="currentColor" />
      </svg>
      <span className="diagram-center">
        Business
        <br />
        <em>value.</em>
      </span>
      <span className="diagram-label diagram-strategy">
        01 / Business strategy
      </span>
      <span className="diagram-label diagram-risk">02 / Risk management</span>
      <span className="diagram-label diagram-tech">03 / Economic analysis</span>
    </div>
  );
}

export function ClosingInvitation() {
  return (
    <section
      className="closing-invitation section-wrap"
      aria-labelledby="closing-heading"
    >
      <SectionLabel number="↗">
        A conversation can change the picture.
      </SectionLabel>
      <div className="closing-row">
        <h2 id="closing-heading">
          Your next move.
          <br />
          <em>A fresh perspective.</em>
        </h2>
        <div>
          <p>
            Bring your business challenge.
            <br />
            Let’s explore what’s possible.
          </p>
          <ActionLink>Let’s talk</ActionLink>
          <p className="small-note">15 minutes. A good place to start.</p>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer
      id="footer"
      className="site-footer landing-footer"
      aria-label="Pretty Penny Intelligence footer"
    >
      <div className="landing-footer-inner">
        <nav className="landing-footer-columns" aria-label="Footer navigation">
          <div className="landing-footer-column">
            <h2>Expertise</h2>
            {[sitePlan.strategy, sitePlan.risk, sitePlan.economics].map(item => (
              <a key={item.path} href={siteHref(item.path)}>{item.label}</a>
            ))}
          </div>
          <div className="landing-footer-column">
            <h2>{sitePlan.company.label}</h2>
            <a href={siteHref(sitePlan.founder.path)}>{sitePlan.founder.label}</a>
            <a href={siteHref('/about/#about-pretty-penny')}>About Pretty Penny</a>
          </div>
          <div className="landing-footer-column">
            <h2>{sitePlan.insights.label}</h2>
            <a href={siteHref(sitePlan.insights.path)}>Latest insights</a>
            <a href={siteHref(sitePlan.publications.path)}>{sitePlan.publications.label}</a>
            <a href={siteHref('/insights/#speaking')}>All Speaking</a>
            {socialLinks.substack && (
              <a
                href={socialLinks.substack}
                target="_blank"
                rel="noopener noreferrer"
              >
                Substack
              </a>
            )}
            {socialLinks.podcast && (
              <a
                href={socialLinks.podcast}
                target="_blank"
                rel="noopener noreferrer"
              >
                Uncharted podcast
              </a>
            )}
          </div>
          <div className="landing-footer-column">
            <h2>{sitePlan.contact.label}</h2>
            <BookingLink>Book a call</BookingLink>
            <a href={siteHref(sitePlan.contact.path)}>Send a message</a>
            {socialLinks.personalLinkedIn && (
              <a
                href={socialLinks.personalLinkedIn}
                target="_blank"
                rel="noopener noreferrer"
              >
                Deniz on LinkedIn
              </a>
            )}
            <a href={COMPANY_LINKEDIN} target="_blank" rel="noopener noreferrer">Pretty Penny on LinkedIn</a>
            {socialLinks.x && (
              <a href={socialLinks.x} target="_blank" rel="noopener noreferrer">
                Deniz on X
              </a>
            )}
          </div>
        </nav>
        <div className="landing-footer-brand" aria-hidden="true">
          <FooterWordmark />
        </div>
        <div className="landing-footer-meta">
          <span>© {new Date().getFullYear()} Pretty Penny Intelligence</span>
          <nav className="landing-footer-socials" aria-label="Social media">
            <a
              href={COMPANY_LINKEDIN}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pretty Penny on LinkedIn (opens in a new tab)"
            >
              <svg
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M20.45 2H3.55C2.7 2 2 2.68 2 3.52v16.96c0 .84.7 1.52 1.55 1.52h16.9c.85 0 1.55-.68 1.55-1.52V3.52c0-.84-.7-1.52-1.55-1.52ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.39-.74 1.36-1.53 2.8-1.53 3 0 3.57 1.97 3.57 4.53v5.25Z" />
              </svg>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}


