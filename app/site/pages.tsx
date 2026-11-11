export { ExpertisePage } from './expertise-page';
export { CompanyPage as AboutPage } from './company-page';
export { ContactPage } from './contact-page';
export { InsightsPage } from './insights-page';
import { PageShell } from './page-shell';
import { ActionLink, SectionLabel } from './shared';
import { siteHref } from './links';
export function NotFoundPage() {
  return <PageShell active="/" closing={false}><section className="page-intro not-found section-wrap"><SectionLabel number="404">A different direction</SectionLabel><h1>This page is<br /><em>out of view.</em></h1><p>Let’s find your way back.</p><ActionLink href={siteHref('/')}>Back to Pretty Penny</ActionLink></section></PageShell>;
}
