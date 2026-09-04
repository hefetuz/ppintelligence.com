'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroArt from './hero-art';
import { DEFAULT_INTRO, findIntro, INTRO_DEFINITIONS } from './intro/registry';
import type { IntroId } from './intro/types';
import { HAND_DIRECTIONS } from './hand-motion';
import ArtCursor from './art-cursor';

const BOOKING_URL = 'https://calendly.com/dtudor-prettypennyintelligence/introductory-meeting';

export default function Home() {
  const [intro, setIntro] = useState(true);
  const [introId, setIntroId] = useState<IntroId>(DEFAULT_INTRO);
  const [compare, setCompare] = useState(false);
  const [configured, setConfigured] = useState(false);
  const definition = findIntro(introId);
  const [skipIntro, setSkipIntro] = useState(false);
  const [replay, setReplay] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const animate = motionOverride ?? !reduced;
  const finishIntro = useCallback(() => setIntro(false), []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync(); media.addEventListener('change', sync);
    const query = new URLSearchParams(window.location.search);
    const requested = query.get('intro');
    setIntroId(requested === 'original' ? 'original' : findIntro(requested)?.id ?? DEFAULT_INTRO);
    setCompare(query.get('compare') === '1');
    // Old review links used scene=1. They must no longer silently skip the opening.
    if (query.has('scene')) {
      query.delete('scene');
      window.history.replaceState(null, '', window.location.pathname + '?' + query.toString());
    }
    setConfigured(true);
    return () => media.removeEventListener('change', sync);
  }, []);
  const replayIntro = () => {
    setMotionOverride(true); setSkipIntro(false); setIntro(true); setReplay(value => value + 1);
  };
  const selectIntro = (id: IntroId) => {
    const url = new URL(window.location.href);
    setIntroId(id); setSkipIntro(false); setIntro(true); setReplay(value => value + 1);
    url.searchParams.delete('scene');
    url.searchParams.set('intro', id); url.searchParams.set('compare', '1');
    window.history.replaceState(null, '', url);
  };
  return <>
    <ArtCursor />
    {compare && <aside className="intro-lab" aria-label="Üç görsel yönü ve el etkileşimini karşılaştır">
      <span className="lab-label">Pretty Penny <span>Art direction / 03</span></span>
      <div className="lab-options">{INTRO_DEFINITIONS.map((item, index) => <Button key={item.id} variant="ghost" className="lab-choice" aria-pressed={introId === item.id} onClick={() => selectIntro(item.id)} title={item.description + ' — ' + HAND_DIRECTIONS[item.id].name}><span className="lab-number">0{index + 1}</span>{item.shortTitle}</Button>)}</div>
      <Button variant="ghost" className="lab-replay" onClick={replayIntro} aria-label="Seçili animasyonu tekrar oynat"><RotateCcw size={15} /><span>Tekrar</span></Button>
      <a className="lab-close" href="/" aria-label="Karşılaştırmayı kapat, mevcut sürüme dön">Kapat <span aria-hidden="true">×</span></a>
    </aside>}
    <main data-direction={introId} className={'hero ' + (intro ? 'intro-running' : 'scene-ready') + (animate ? '' : ' motion-paused')}>
    <div className="artwork">{configured && <HeroArt key={introId + replay} animate={animate} skipIntro={skipIntro} onIntroComplete={finishIntro} definition={definition} />}</div>
    <header className="hero-header">
      <a className="identity" href="/" aria-label="Pretty Penny Intelligence home">
        <img className="pp-mark" src="/pp-logo.svg" alt="" width={44} height={44} />
        <span className="wordmark">Pretty Penny<span>Intelligence</span></span>
      </a>
      <span className="header-descriptor">Independent minds. Lasting impact.</span>
      <a className="header-contact" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">Let’s talk <span><ArrowUpRight size={18} /></span></a>
    </header>
    <section className={'hero-title t-stagger ' + (intro ? '' : 'is-shown')} aria-labelledby="hero-heading" inert={intro}>
      <p className="eyebrow t-stagger-line t-stagger-line--1">Strategy. Risk. Possibility.</p>
      <h1 id="hero-heading"><span className="t-stagger-line t-stagger-line--2">Make every</span><em className="t-stagger-line t-stagger-line--3">penny count.</em></h1>
    </section>
    <div className="scene-annotation" aria-hidden="true"><span />{definition ? HAND_DIRECTIONS[definition.id].hint : 'A little intelligence changes everything.'}</div>
    <section className={'hero-bottom t-stagger ' + (intro ? '' : 'is-shown')} aria-label="About Pretty Penny" inert={intro}>
      <div className="advisory-copy t-stagger-line t-stagger-line--3">
        <p className="section-label">Good thinking. Tangible value.</p>
        <p className="hero-description">We connect strategy, risk and technology to help your business spend smarter, grow stronger and move forward with confidence.</p>
      </div>
      <div className="conversion t-stagger-line t-stagger-line--4">
        <Button className="primary-cta" nativeButton={false} render={<a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" />}>
          Let’s find your next move <span className="cta-arrow"><ArrowUpRight size={22} /></span>
        </Button>
        <p className="cta-note">Your business. A fresh perspective. 15 minutes.</p>
      </div>
    </section>
    <footer className="hero-footer">
      <a className="founder" href="https://www.linkedin.com/in/denizktudor/" target="_blank" rel="noopener noreferrer">
        <span className="founder-label">Led by</span> Deniz K. Tudor <span className="credentials">PhD, MSL</span><ArrowUpRight size={14} />
      </a>
      <div className="scene-controls">
        <a className="linkedin-link" href="https://www.linkedin.com/company/pretty-penny-intelligence/" target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={14} /></a>
        <Button className="scene-control replay-control" variant="ghost" onClick={replayIntro} aria-label="Replay introduction" title="Replay introduction"><RotateCcw size={15} /><span>Replay intro</span></Button>
        <Button className="scene-control pause-control" variant="ghost" size="icon" onClick={() => setMotionOverride(!animate)} aria-pressed={!animate} aria-label={animate ? 'Pause animation' : 'Play animation'} title={animate ? 'Pause animation' : 'Play animation'}>{animate ? <Pause size={15} /> : <Play size={15} />}</Button>
      </div>
    </footer>
    <div className="intro-caption" aria-hidden={!intro} inert={!intro}>
      <span className="intro-label">Pretty Penny Intelligence</span>
      <span className="intro-rule" style={{ animationDuration: (definition?.releaseAt ?? 3.45) + 's' }} key={introId + replay} />
      <p>{definition?.caption ?? 'Possibility, taking shape.'}</p>
      <Button className="skip-intro" variant="ghost" onClick={() => { setSkipIntro(true); setIntro(false); }}>Skip intro <ArrowUpRight size={15} /></Button>
    </div>
    <p className="sr-only" role="status">{intro ? 'Introducing Pretty Penny Intelligence. You can skip the introduction.' : 'The hero is ready.'}</p>
    <noscript><style>{'.hero-title,.hero-bottom,.hero-footer,.header-contact,.header-descriptor,.scene-annotation,.t-stagger-line{opacity:1!important;visibility:visible!important;transform:none!important;filter:none!important}.intro-caption{display:none!important}'}</style><p className="no-script-message">Strategic advisory by Deniz K. Tudor. <a href={BOOKING_URL}>Book an introductory call.</a></p></noscript>
  </main></>;
}
