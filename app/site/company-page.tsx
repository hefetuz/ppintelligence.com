'use client';
import { useEffect, useState } from 'react';
/* oxlint-disable next/no-img-element -- Existing self-hosted editorial artwork supports the portable build. */
import { Compass, ScanLine, MessageSquareText } from '@/components/sharp-icons';
import { PageShell } from './page-shell';
import { siteHref } from './links';
import { ArchitecturePreview } from './architecture-preview';
import { DecisionContext } from './company-context';
import { CompanyHowWeWork } from './company-how-we-work';
import { CompanyValueScene } from './company-value-scene';
import { VentureArtwork } from './venture-artwork';
import { COMPANY_LINKEDIN, pageCopy } from './content';
import { sitePlan } from './routes';
import { assetUrl } from '../asset-url';
import './company-story.css';
import './company-decision.css';
import './company-surface-preview.css';
import './company-texture-preview.css';
import './deniz-profile.css';
import './company-frame.css';

const qualifications = [
  ['PhD in Economics', 'University of California, San Diego'],
  ['Master of Science in Law', 'Fordham University'],
  ['Postgraduate Accounting Degree', 'Harvard'],
  ['Leadership certificates', 'MIT and Yale'],
] as const;
const expertise = [
  'Executive strategy & business planning',
  'M&A & integrations',
  'Governance & board relations',
  'Change management & transformation',
  'Finance & operations',
  'Stakeholder relations',
  'Team leadership & talent development',
  'Enterprise risk management',
  'Regulatory compliance',
  'AI Enablement and Governance',
];
const founderVentures = [
  {
    id: 'pretty-penny', label: 'Pretty Penny Intelligence',
    category: 'Business consulting',
    lead: 'Business consulting that brings strategy, innovation, compliance and risk management together.',
    detail: 'Working with corporate and small business clients, Pretty Penny develops frameworks, project plans, workshops and processes that help clients move forward with technological changes.',
    url: COMPANY_LINKEDIN, action: 'View LinkedIn',
  },
  {
    id: 'apkallu', label: 'Apkallu',
    category: 'Executive network',
    lead: 'Experienced executives and specialists, brought together around each business challenge.',
    detail: 'Apkallu’s expertise spans strategy, risk, compliance, operations, marketing, technology, AI and people, with teams assembled for projects, growth and transformation.',
    url: '', action: '',
  },
  {
    id: 'nexus', label: 'Nexus Marketplace AI',
    category: 'Vendor marketplace',
    lead: 'A platform connecting vendor search, procurement and vendor management.',
    detail: 'Built by former Moody’s colleagues, Nexus combines AI with subject-matter expert vetting to help businesses evaluate vendors and navigate procurement in one place.',
    url: 'https://nexusmarketplace.ai/', action: 'Visit Nexus',
  },
] as const;

export function CompanyPage() {
  const [ventureIndex, setVentureIndex] = useState(0);
  useEffect(() => {
    if (new URLSearchParams(location.search).get('texture') !== 'original') {
      document.documentElement.dataset.companyTexture = 'fine';
    }
    if (new URLSearchParams(location.search).get('surface') !== 'original') {
      const root = document.documentElement;
      root.dataset.companySurface = 'perspective';
      const header = document.querySelector<HTMLElement>('.site-header__frame');
      const panel = document.querySelector<HTMLElement>('.founder-panel');
      if (header && panel) {
        const align = () => {
          // Text has an extra mobile inset; every chapter follows the page rules.
          const page = panel.closest('.replay-site')!;
          const box = page.getBoundingClientRect();
          const guide = getComputedStyle(page, '::before');
          const leading = Number.parseFloat(guide.left) || 0;
          const trailing = Number.parseFloat(guide.right) || leading;
          const h = { left: box.left + leading, width: box.width - leading - trailing };
          const p = panel.getBoundingClientRect();
          root.style.setProperty('--preview-grid-step', h.width + 'px');
          root.style.setProperty('--preview-grid-origin', h.left - p.left + 'px');
          root.style.setProperty('--preview-outer-origin', h.left - p.left + 'px');
          root.style.setProperty('--preview-outer-width', h.width + 'px');
          const content = panel.querySelector('.founder-panel__frame');
          if (page && content) {
            root.style.setProperty('--company-guide-end',
              content.getBoundingClientRect().bottom - page.getBoundingClientRect().top + 'px');
          }
        };
        const observer = new ResizeObserver(align);
        observer.observe(header);
        observer.observe(panel);
        observer.observe(panel.closest('.replay-site')!);
        align();
        return () => {
          observer.disconnect();
          delete root.dataset.companyTexture;
          delete root.dataset.companySurface;
          ['--preview-grid-step', '--preview-grid-origin', '--preview-outer-origin', '--preview-outer-width', '--company-guide-end'].forEach(key => root.style.removeProperty(key));
        };
      }
    }
    return () => { delete document.documentElement.dataset.companyTexture; delete document.documentElement.dataset.companySurface; };
  }, []);
  const meetDeniz = (
        <section id="meet-deniz" className="deniz-profile" aria-labelledby="deniz-profile-heading" data-ascii="skip">
          <div className="deniz-profile__frame">
            <div className="deniz-profile__opening">
              <div className="deniz-profile__identity">
                <p className="deniz-profile__eyebrow">Meet Deniz</p>
                <h2 id="deniz-profile-heading">Deniz K. Tudor</h2>
              </div>
              <figure className="deniz-profile__portrait">
                <img src={assetUrl('assets/deniz/deniz-photo-cutout-v1.png')} alt="Deniz Tudor" width={400} height={400} decoding="async" loading="lazy" />
                <figcaption>Founder, Pretty Penny Intelligence</figcaption>
              </figure>
            </div>
            <div className="deniz-profile__introduction">
              <p className="deniz-profile__eyebrow">Biography</p>
              <p className="deniz-profile__lead">Executive, advisor, writer and speaker. Connecting business strategy with the realities of risk and change.</p>
              <p>Deniz brings more than 20 years of corporate, startup, consulting and academic experience. She has built companies, products, departments and global teams from the ground up, with leadership experience at Moody’s, Bread Financial, Chatham Financial and fintech platform TabaPay.</p>
              <p>Her work bridges business and risk, bringing together innovation, practical execution and stakeholder relationships. She works with boards and leadership teams, as well as regulators, auditors, investors, rating agencies and external advisors.</p>
              <a className="action-button action-button--compact action-button--on-dark deniz-profile__link" href={siteHref('/contact/')}>Contact Deniz</a>
            </div>
            <section className="deniz-profile__qualifications" aria-labelledby="deniz-qualifications-heading">
              <h3 id="deniz-qualifications-heading" className="deniz-profile__label">Education & qualifications</h3>
              <dl>{qualifications.map(([qualification, institution], index) => <div key={qualification}>
                <dt><span className="deniz-profile__number" aria-hidden="true">0{index + 1}</span>{qualification}</dt>
                <dd>{institution}</dd>
              </div>)}</dl>
            </section>
            <section className="deniz-profile__expertise" aria-labelledby="deniz-expertise-heading">
              <h3 id="deniz-expertise-heading" className="deniz-profile__label">Areas of expertise</h3>
              <ul>{expertise.map(area => <li key={area}>{area}</li>)}</ul>
            </section>
            <div className="deniz-profile__community">
              <p>A frequent speaker at CeFPro and GFMI events, Deniz also serves on CeFPro’s Advisory Board. She co-hosted the Seven Elements Ethics and Compliance Book Club with Ellen M. Hunt, and co-hosted the <a href="https://security-uncharted.com/" target="_blank" rel="noopener noreferrer">Uncharted podcast</a> with Paula Fontana.</p>
              <a className="action-button action-button--compact action-button--on-dark deniz-profile__link" href={siteHref('/insights/#speaking')}>View talks</a>
            </div>
          </div>
        </section>
  );
  return (
    <PageShell active="/about/" closing={false}>
      <div className="company-story">
        <section
          id="about-pretty-penny"
          className="company-centered-hero"
          aria-labelledby="company-heading"
        >
          <div className="company-centered-hero__frame">
            <div className="company-centered-hero__content">
              <p className="company-centered-hero__label">{sitePlan.company.label}</p>
              <h1 id="company-heading">
                {pageCopy.company?.heading ??
                  'Find the value behind the numbers.'}
              </h1>
              <p className="company-centered-hero__deck">
                {pageCopy.company?.description ?? (
                  <>
                    We connect financial evidence with strategy, risk and
                    economic context, so you can see what your next decision
                    means for the business.
                  </>
                )}
              </p>
              <a
                className="company-centered-hero__button"
                href={siteHref('/about/#approach')}
              >
                Our approach
              </a>
            </div>
          </div>
          <CompanyValueScene />
        </section>

        <section
          id="values"
          className="company-values"
          aria-labelledby="company-values-heading"
        >
          <div className="company-values__inner">
            <header className="company-values__heading">
              <p>Our values</p>
              <h2 id="company-values-heading">What guides our work.</h2>
            </header>
            <div className="company-values__grid">
              <article className="company-value">
                <div className="company-value__meta">
                  <Compass size={24} strokeWidth={1.5} aria-hidden="true" />
                  <span>01</span>
                </div>
                <div>
                  <h3>
                    {pageCopy.company?.values?.[0]?.title ??
                      'Understand the business.'}
                  </h3>
                  <p>
                    {pageCopy.company?.values?.[0]?.body ??
                      'Start with the priorities, constraints and people behind a decision.'}
                  </p>
                </div>
              </article>
              <article className="company-value">
                <div className="company-value__meta">
                  <ScanLine size={24} strokeWidth={1.5} aria-hidden="true" />
                  <span>02</span>
                </div>
                <div>
                  <h3>
                    {pageCopy.company?.values?.[1]?.title ??
                      'Question the assumptions.'}
                  </h3>
                  <p>
                    {pageCopy.company?.values?.[1]?.body ??
                      'Test the evidence and assumptions behind each decision.'}
                  </p>
                </div>
              </article>
              <article className="company-value">
                <div className="company-value__meta">
                  <MessageSquareText
                    size={24}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span>03</span>
                </div>
                <div>
                  <h3>
                    {pageCopy.company?.values?.[2]?.title ??
                      'Make the thinking clear.'}
                  </h3>
                  <p>
                    {pageCopy.company?.values?.[2]?.body ??
                      'Explain the reasoning and trade-offs so the decision is yours to make.'}
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {meetDeniz}
        <ArchitecturePreview>
        <section
          id="approach"
          className="company-decision-section"
          aria-labelledby="approach-heading"
        >
          <div className="company-decision-spacer" aria-hidden="true">
            <div />
          </div>
          <div className="company-decision-body">
            <div className="company-decision-frame">
              <div className="company-decision-heading">
                <h2 id="approach-heading">
                  {pageCopy.company?.approachHeading ??
                    'Look beyond the numbers.'}
                </h2>
                <div className="company-decision-copy">
                  {pageCopy.company?.approachBody ? (
                    pageCopy.company.approachBody.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))
                  ) : (
                    <>
                      <p>
                        A growth opportunity changes your exposure. A shift in
                        the economy changes your options. A resource constraint
                        changes what is possible.
                      </p>
                      <p>
                        Pretty Penny brings strategy, risk and economic analysis
                        into the same conversation. We examine how the pieces
                        connect, so you can consider a decision in the context
                        of your whole business.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <DecisionContext />
            </div>
          </div>
        </section>



        <section
          id="founder"
          className="founder-panel"
          aria-labelledby="how-we-work-heading"
        >
          <div className="founder-panel__frame">
            <CompanyHowWeWork />
          </div>
          <div className="founder-panel__stripes" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </section>

        </ArchitecturePreview>
          <section
            id="ventures"
            className="company-ventures"
            aria-labelledby="company-ventures-heading"
          >
            <div className="company-ventures__inner" data-ascii="skip">
              <div className="company-ventures__content">
                <header className="company-ventures__header">
                  <p className="company-overline">Deniz’s ventures</p>
                  <h2 id="company-ventures-heading">Three ventures.<br />Connected expertise.</h2>
                  <p className="company-ventures__intro">Deniz founded Pretty Penny Intelligence, Apkallu and Nexus Marketplace AI.</p>
                </header>
                <div className="company-ventures__list">
                  {founderVentures.map((venture, index) => (
                    <div key={venture.id} className="company-venture" data-active={index === ventureIndex}>
                      <h3>
                        <button id={'venture-button-' + venture.id} type="button"
                          aria-label={venture.label} aria-expanded={index === ventureIndex} aria-controls={'venture-panel-' + venture.id}
                          onClick={() => setVentureIndex(index)}>
                          <span className="company-venture__category" aria-hidden="true">{venture.category}</span>
                          <span className="company-venture__title">{venture.label}</span>
                        </button>
                      </h3>
                      <section className="company-venture__body" id={'venture-panel-' + venture.id}
                        aria-labelledby={'venture-button-' + venture.id} inert={index !== ventureIndex}>
                        <div className="company-venture__clip">
                          <div className="company-venture__copy">
                            <p className="company-venture__name" aria-hidden="true">{venture.label}</p>
                            <p className="company-venture__lead">{venture.lead}</p>
                            <p>{venture.detail}</p>
                            {venture.url && <a className="action-button action-button--compact action-button--on-dark company-venture__action" href={venture.url} target="_blank" rel="noopener noreferrer">
                              {venture.action}
                            </a>}
                          </div>
                        </div>
                      </section>
                    </div>
                  ))}
                </div>
                <fieldset className="company-ventures__steps" aria-label="Choose a venture">
                  {founderVentures.map((venture, index) => (
                    <button
                      key={venture.id}
                      type="button"
                      aria-label={`0${index + 1} ${venture.label}`}
                      aria-current={index === ventureIndex ? 'step' : undefined}
                      aria-controls={`venture-panel-${venture.id}`}
                      data-reached={index <= ventureIndex}
                      onClick={() => setVentureIndex(index)}
                    >
                      0{index + 1}
                    </button>
                  ))}
                </fieldset>
              </div>
              <div className="company-ventures__visual" aria-hidden="true">
                {founderVentures.map((venture, index) => (
                  <div key={venture.id} className="company-ventures__art-layer" data-active={index === ventureIndex}>
                    <VentureArtwork venture={venture.id} />
                  </div>
                ))}
              </div>
            </div>
          </section>

      </div>
    </PageShell>
  );
}
