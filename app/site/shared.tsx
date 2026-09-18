'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { assetUrl } from '../asset-url';
import { BOOKING_URL, COMPANY_LINKEDIN, FOUNDER_LINKEDIN, navigation, type SitePath } from './content';

export function siteHref(path: string) {
  return assetUrl(path.replace(/^\//, ''));
}

export function Identity() {
  return <a className="identity" href={siteHref('/')} aria-label="Pretty Penny Intelligence home">
    <img className="pp-mark" src={assetUrl('pp-logo.svg')} alt="" width={40} height={44} />
    <span className="wordmark">Pretty Penny<span>Intelligence</span></span>
  </a>;
}

export function SiteHeader({ active, hero = false }: { active: SitePath; hero?: boolean }) {
  const [open, setOpen] = useState(false);
  return <header className={hero ? 'hero-header site-header' : 'site-header inner-header'}>
    <Identity />
    <nav className="desktop-nav" aria-label="Main navigation">
      {navigation.slice(1).map(item => <a key={item.path} href={siteHref(item.path)} aria-current={active === item.path ? 'page' : undefined}>{item.label}</a>)}
    </nav>
    <a className="header-contact" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">Let’s talk <span><ArrowUpRight size={18} /></span></a>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button className="mobile-menu-trigger" variant="ghost" aria-label="Open navigation" />}><Menu size={23} /></SheetTrigger>
      <SheetContent className="mobile-menu" side="right">
        <SheetTitle className="menu-title">Pretty Penny Intelligence</SheetTitle>
        <SheetDescription className="menu-description">Independent minds. Lasting impact.</SheetDescription>
        <nav aria-label="Mobile navigation">{navigation.map((item, index) => <a key={item.path} href={siteHref(item.path)} aria-current={active === item.path ? 'page' : undefined} onClick={() => setOpen(false)}><span>0{index + 1}</span>{item.label}<ArrowUpRight size={23} /></a>)}</nav>
        <a className="menu-booking" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">Book an introductory call <ArrowUpRight size={18} /></a>
      </SheetContent>
    </Sheet>
  </header>;
}

export function ActionLink({ children, href = BOOKING_URL, light = false }: { children: ReactNode; href?: string; light?: boolean }) {
  const external = href.startsWith('https://');
  return <a className={'primary-cta action-link' + (light ? ' light-cta' : '')} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
    {children}<span className="cta-arrow">{external ? <ArrowUpRight size={20} /> : <ArrowRight size={20} />}</span>
  </a>;
}

export function TextLink({ children, href, external = false }: { children: ReactNode; href: string; external?: boolean }) {
  return <a className="text-link" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}{external ? <ArrowUpRight size={17} /> : <ArrowRight size={17} />}</a>;
}

export function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return <p className="chapter-label"><span>{number}</span>{children}</p>;
}

export function OrbitDiagram({ compact = false }: { compact?: boolean }) {
  return <div className={'orbit-diagram' + (compact ? ' orbit-diagram--compact' : '')} role="img" aria-label="Strategy, risk and technology connected around business value">
    <svg viewBox="0 0 520 520" fill="none" aria-hidden="true">
      <circle cx="260" cy="260" r="225" stroke="currentColor" opacity=".2" />
      <circle cx="260" cy="260" r="175" stroke="currentColor" opacity=".16" strokeDasharray="2 7" />
      <ellipse cx="260" cy="260" rx="220" ry="98" transform="rotate(-35 260 260)" stroke="currentColor" opacity=".5" />
      <ellipse cx="260" cy="260" rx="220" ry="98" transform="rotate(35 260 260)" stroke="currentColor" opacity=".25" />
      <path d="M260 23V38M497 260H482M260 497V482M23 260H38" stroke="currentColor" />
      <circle cx="260" cy="260" r="70" stroke="currentColor" opacity=".45" />
      <circle cx="120" cy="126" r="5" fill="currentColor" />
      <circle cx="428" cy="279" r="5" fill="currentColor" />
      <circle cx="163" cy="424" r="5" fill="currentColor" />
    </svg>
    <span className="diagram-center">Business<br /><em>value.</em></span>
    <span className="diagram-label diagram-strategy">01 / Strategy</span>
    <span className="diagram-label diagram-risk">02 / Risk</span>
    <span className="diagram-label diagram-tech">03 / Technology</span>
  </div>;
}

export function ClosingInvitation() {
  return <section className="closing-invitation section-wrap" aria-labelledby="closing-heading">
    <SectionLabel number="↗">A conversation can change the picture.</SectionLabel>
    <div className="closing-row"><h2 id="closing-heading">Your next move.<br /><em>A fresh perspective.</em></h2><div><p>Bring your business challenge.<br />Let’s explore what’s possible.</p><ActionLink>Let’s talk</ActionLink><p className="small-note">15 minutes. A good place to start.</p></div></div>
  </section>;
}

export function SiteFooter({ active = '/' }: { active?: SitePath }) {
  return <footer className="site-footer section-wrap">
    <div className="footer-top"><Identity /><p>Independent minds.<br />Lasting impact.</p><nav aria-label="Footer navigation">{navigation.slice(1).map(item => <a key={item.path} href={siteHref(item.path)}>{item.label}</a>)}</nav></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Pretty Penny Intelligence</span><div><a href={COMPANY_LINKEDIN} target="_blank" rel="noopener noreferrer">Company LinkedIn <ArrowUpRight size={14} /></a><a href={FOUNDER_LINKEDIN} target="_blank" rel="noopener noreferrer">Connect with Deniz <ArrowUpRight size={14} /></a><a href={siteHref(active + '#top')}>Back to top <ArrowDown className="arrow-up" size={14} /></a></div></div>
  </footer>;
}
