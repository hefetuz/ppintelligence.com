'use client';

import type { ReactNode } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import ArtCursor from '../art-cursor';
import { assetUrl } from '../asset-url';
import { COMPANY_LINKEDIN, FOUNDER_LINKEDIN, engagements, expertise, type SitePath } from './content';
import { ActionLink, ClosingInvitation, OrbitDiagram, SectionLabel, SiteFooter, SiteHeader, TextLink, siteHref } from './shared';

function PageShell({ active, children, closing = true }: { active: SitePath; children: ReactNode; closing?: boolean }) {
  return <div id="top" className="site-page"><a className="skip-link" href={siteHref(active + '#main-content')}>Skip to content</a><ArtCursor /><SiteHeader active={active} /><main id="main-content" tabIndex={-1}>{children}{closing && <ClosingInvitation />}</main><SiteFooter active={active} /></div>;
}

export function ExpertisePage() {
  return <PageShell active="/expertise/">
    <section className="page-intro section-wrap">
      <SectionLabel number="01—03">Our expertise</SectionLabel>
      <div className="page-intro-grid"><h1>Expertise that<br /><em>connects the dots.</em></h1><div><p className="page-lead">The most useful perspective is rarely a single one.</p><p>Bring your business challenge into focus through strategy, risk and economic thinking — with an eye for how technology can help.</p></div></div>
      <nav className="expertise-jump" aria-label="Expertise areas">{expertise.map(item => <a key={item.id} href={siteHref('/expertise/#' + item.id)}><span>{item.number}</span>{item.name}<ArrowDown size={16} /></a>)}</nav>
    </section>
    <div className="expertise-details section-wrap">{expertise.map(item => <section className="expertise-detail" id={item.id} key={item.id} aria-labelledby={item.id + '-heading'}><div className="expertise-side"><SectionLabel number={item.number}>{item.name}</SectionLabel><span className="service-word" aria-hidden="true">{item.word}</span><p className="service-question">{item.question}</p></div><div className="expertise-body"><h2 id={item.id + '-heading'}>{item.lead}</h2><p>{item.description}</p><ul className="capability-list">{item.areas.map(area => <li key={area}>{area}<span aria-hidden="true">+</span></li>)}</ul><TextLink href={siteHref('/contact/')}>Let’s discuss your business</TextLink></div></section>)}</div>
    <section className="engagements-section section-wrap" aria-labelledby="engagements-heading"><SectionLabel number="04">Ways to work together</SectionLabel><div className="section-heading-row"><h2 className="editorial-heading" id="engagements-heading">The right conversation.<br /><em>The right format.</em></h2><p>From a focused business question to a room full of new perspectives.</p></div><div className="engagement-grid">{engagements.map(item => <article key={item.number}><span className="row-number">{item.number}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></section>
  </PageShell>;
}

export function AboutPage() {
  return <PageShell active="/about/">
    <section className="page-intro about-intro section-wrap"><SectionLabel number="01">Independent thinking. Human intelligence.</SectionLabel><h1>A little perspective.<br /><em>A lot of possibility.</em></h1><div className="about-intro-bottom"><span className="about-monogram" aria-hidden="true"><img src={assetUrl('pp-logo.svg')} alt="" width={170} height={190} /></span><div><p className="page-lead">Good decisions start with seeing the whole picture.</p><p>Pretty Penny Intelligence brings connected thinking to questions of growth, performance and change. A business is a system of people, decisions and possibilities. Understanding those connections is where the work begins.</p></div></div></section>
    <section className="about-founder section-wrap" aria-labelledby="deniz-heading"><div><SectionLabel number="02">The person behind the perspective</SectionLabel><h2 id="deniz-heading" className="founder-name">Deniz<br /><em>Tudor.</em></h2><p className="founder-role">Founder / Pretty Penny Intelligence</p><TextLink href={FOUNDER_LINKEDIN} external>Connect with Deniz</TextLink></div><div className="biography"><p className="page-lead">Business ambition. Analytical depth.<br />A practical point of view.</p><p>Deniz’s work spans business strategy, risk management, economic analysis and technology enablement. Her experience includes building businesses, departments and teams, alongside business development, M&A, efficiency and cost reduction.</p><p>Pretty Penny Intelligence brings these disciplines together to help businesses consider their opportunities, understand their challenges and decide where to go next.</p><div className="biography-topics"><span>Strategy & growth</span><span>Analytics & operations</span><span>Risk & governance</span><span>Technology & efficiency</span></div></div></section>
    <section className="name-story section-wrap" aria-labelledby="name-heading"><div><SectionLabel number="03">Behind the name</SectionLabel><h2 className="editorial-heading" id="name-heading">Value is in<br /><em>the details.</em></h2><p>A penny may be small. The thinking behind how you use it doesn’t have to be.</p><p>The Pretty Penny name reflects a practical purpose: helping businesses find value through efficiency, productivity, strategy and innovation. Small improvements and thoughtful decisions can open up new possibilities.</p><TextLink href={siteHref('/expertise/')}>Discover our expertise</TextLink></div><OrbitDiagram compact /></section>
  </PageShell>;
}

export function ContactPage() {
  return <PageShell active="/contact/" closing={false}>
    <section className="contact-intro section-wrap"><SectionLabel number="↗">A good place to start</SectionLabel><div className="contact-grid"><div><h1>What’s on<br /><em>your mind?</em></h1><p className="contact-lead">A business to grow.<br />A challenge to untangle.<br />A possibility to explore.</p><p className="contact-copy">Whatever brings you here, let’s start with a conversation.</p></div><div className="booking-panel"><span className="booking-index">01 / A first conversation</span><h2>Your business.<br /><em>Our starting point.</em></h2><p>A 15-minute introductory call with Deniz Tudor to discuss your business needs and timelines.</p><div className="booking-facts"><span>15 minutes</span><span>By phone</span><span>With Deniz Tudor</span></div><ActionLink>Find a time to talk</ActionLink><p className="small-note">Choose a time on Calendly. Opens in a new tab.</p></div></div></section>
    <section className="conversation-section section-wrap" aria-labelledby="conversation-heading"><div><SectionLabel number="02">Before we speak</SectionLabel><h2 className="editorial-heading" id="conversation-heading">Bring your questions.<br /><em>Start where you are.</em></h2><p>No presentation needed. A little context is enough to begin.</p></div><ol className="conversation-list"><li><span>01</span><div><h3>Your business</h3><p>What do you do, and where are you today?</p></div></li><li><span>02</span><div><h3>Your priorities</h3><p>What are you working toward, or trying to understand?</p></div></li><li><span>03</span><div><h3>Your timeline</h3><p>Is there a decision, opportunity or change on the horizon?</p></div></li></ol></section>
    <section className="contact-social section-wrap" aria-label="Connect on LinkedIn"><p>Keep the conversation going.</p><a href={COMPANY_LINKEDIN} target="_blank" rel="noopener noreferrer">Pretty Penny Intelligence<ArrowUpRight size={21} /></a><a href={FOUNDER_LINKEDIN} target="_blank" rel="noopener noreferrer">Deniz Tudor<ArrowUpRight size={21} /></a></section>
  </PageShell>;
}

export function NotFoundPage() {
  return <PageShell active="/" closing={false}><section className="page-intro not-found section-wrap"><SectionLabel number="404">A different direction</SectionLabel><h1>This page is<br /><em>off the map.</em></h1><p>Let’s bring you back to the bigger picture.</p><ActionLink href={siteHref('/')}>Back to home</ActionLink></section></PageShell>;
}
