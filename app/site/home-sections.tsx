import { ArrowUpRight } from 'lucide-react';
import { expertise } from './content';
import { ClosingInvitation, OrbitDiagram, SectionLabel, TextLink, siteHref } from './shared';

export default function HomeSections() {
  return <>
    <section className="perspective-section section-wrap" aria-labelledby="perspective-heading">
      <SectionLabel number="01">The bigger picture</SectionLabel>
      <div className="perspective-grid"><div><h2 id="perspective-heading" className="editorial-heading">A broader view.<br /><em>A clearer way forward.</em></h2><div className="intro-prose"><p>Business decisions rarely sit in one discipline. Growth changes your exposure to risk. Technology changes how your teams work.</p><p>Pretty Penny Intelligence brings these questions together, connecting strategy, risk and technology to help you see where value can be created.</p><TextLink href={siteHref('/about/')}>The thinking behind Pretty Penny</TextLink></div></div><OrbitDiagram /></div>
      <div className="audience-line"><span>Built around your business.</span><p>Startups <span>/</span> Growing businesses <span>/</span> Financial institutions</p></div>
    </section>
    <section className="expertise-preview section-wrap" aria-labelledby="expertise-heading">
      <div className="section-topline"><SectionLabel number="02">Connected expertise</SectionLabel><TextLink href={siteHref('/expertise/')}>Explore our expertise</TextLink></div>
      <h2 id="expertise-heading" className="editorial-heading">Different lenses.<br /><em>One business. Yours.</em></h2>
      <div className="expertise-rows">{expertise.map(item => <a className="expertise-row" href={siteHref('/expertise/#' + item.id)} key={item.id}><span className="row-number">{item.number}</span><h3>{item.name}</h3><p>{item.summary}</p><span className="row-arrow"><ArrowUpRight size={25} /></span></a>)}</div>
    </section>
    <section className="founder-section section-wrap" aria-labelledby="founder-heading">
      <div className="founder-editorial-mark" aria-hidden="true"><span>Independent<br /><em>by design.</em></span><span className="founder-mark-caption">Pretty Penny Intelligence / A human perspective</span></div>
      <div className="founder-prose"><SectionLabel number="03">Meet the founder</SectionLabel><h2 id="founder-heading" className="editorial-heading">Good thinking<br />starts with <em>people.</em></h2><p>Founded by Deniz Tudor, Pretty Penny Intelligence brings an independent perspective to the practical work of building businesses, solving problems and making decisions.</p><p>Strategy, analytics, operations and risk — connected by a curiosity for how your business can work better.</p><TextLink href={siteHref('/about/')}>Meet Deniz Tudor</TextLink><div className="founder-signoff">Deniz Tudor<span>Founder, Pretty Penny Intelligence</span></div></div>
    </section>
    <ClosingInvitation />
  </>;
}
