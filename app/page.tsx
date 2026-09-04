'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroArt from './hero-art';

const BOOKING_URL = 'https://calendly.com/dtudor-prettypennyintelligence/introductory-meeting';

export default function Home() {
  const [intro, setIntro] = useState(true);
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
    return () => media.removeEventListener('change', sync);
  }, []);

  const replayIntro = () => {
    setMotionOverride(true); setSkipIntro(false); setIntro(true); setReplay(value => value + 1);
  };

  return <main className={`hero ${intro ? 'intro-running' : 'scene-ready'}`}>
    <div className="artwork"><HeroArt key={replay} animate={animate} skipIntro={skipIntro} onIntroComplete={finishIntro} /></div>
    <header className="hero-header">
      <a className="identity" href="/" aria-label="Pretty Penny Intelligence home">
        <img className="pp-mark" src="/pp-logo.svg" alt="" width={38} height={38} />
        <span className="wordmark">Pretty Penny<span>Intelligence</span></span>
      </a>
      <nav className="header-links" aria-label="Primary navigation">
        <a href="https://www.linkedin.com/company/pretty-penny-intelligence/" target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight size={14} /></a>
        <a className="header-contact" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">Let’s talk <ArrowUpRight size={16} /></a>
      </nav>
    </header>

    <section className="hero-copy" aria-labelledby="hero-heading">
      <p className="eyebrow"><span /> INDEPENDENT STRATEGIC ADVISORY</p>
      <h1 id="hero-heading">Less friction.<br /><em>More fortune.</em></h1>
      <p className="hero-description">Strategy, risk and technology—working together to cut costs, unlock growth and move your business forward.</p>
      <p className="audience">For startups, growing businesses and financial institutions.</p>
      <Button className="primary-cta" nativeButton={false} render={<a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" />}>
        Let’s talk about your business <ArrowUpRight size={20} />
      </Button>
      <p className="cta-note">A 15-minute introductory call with Deniz Tudor.</p>
    </section>

    <div className="intro-caption" aria-hidden={!intro}>
      <p>A little intelligence.<br /><span>A world of possibility.</span></p>
      <Button className="skip-intro" variant="ghost" onClick={() => { setSkipIntro(true); setIntro(false); }}>Skip intro <ArrowDownRight size={16} /></Button>
    </div>

    <footer className="hero-footer">
      <a className="founder" href="https://www.linkedin.com/in/denizktudor/" target="_blank" rel="noopener noreferrer"><span className="status-dot" /><span>LED BY <strong>DENIZ K. TUDOR</strong><small>PhD, MSL · Strategy, risk &amp; innovation</small></span><ArrowUpRight size={14} /></a>
      <div className="scene-controls">
        <span className="interaction-hint">A little curiosity goes a long way.</span>
        <Button className="scene-control replay-control" variant="ghost" size="icon" onClick={replayIntro} aria-label="Replay introduction" title="Replay introduction"><RotateCcw size={16} /></Button>
        <Button className="scene-control" variant="ghost" size="icon" onClick={() => setMotionOverride(!animate)} aria-pressed={!animate} aria-label={animate ? 'Pause animation' : 'Play animation'} title={animate ? 'Pause animation' : 'Play animation'}>{animate ? <Pause size={16} /> : <Play size={16} />}</Button>
      </div>
    </footer>
    <p className="sr-only" role="status">{intro ? 'Introducing Pretty Penny Intelligence.' : 'The hero is ready.'}</p>
    <noscript><style>{'.hero-copy,.hero-footer,.header-links{opacity:1!important;visibility:visible!important;transform:none!important}.intro-caption{display:none!important}'}</style></noscript>
  </main>;
}
