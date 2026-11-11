import Home from '../app/page';
import { AboutPage, ContactPage, ExpertisePage, InsightsPage, NotFoundPage } from '../app/site/pages';
import { ExpertiseDetailPage, InsightDetailPage } from '../app/site/detail-pages';
import { insights, publishedExpertise, pageMeta, routes } from '../app/site/content';
import { resolveSiteRoute } from '../app/site/routes';

export { pageMeta, routes };
export { setStaticAssetBase } from '../app/asset-url';

export function Site({ pathname }: { pathname: string }) {
  const route = resolveSiteRoute(pathname, routes);
  switch (route?.kind) {
    case 'home': return <Home />;
    case 'expertise': return <ExpertisePage />;
    case 'company': return <AboutPage />;
    case 'insights': return <InsightsPage />;
    case 'contact': return <ContactPage />;
    case 'expertise-detail': {
      const record = publishedExpertise.find(item => item.id === route.recordId);
      return record ? <ExpertiseDetailPage record={record} /> : <NotFoundPage />;
    }
    case 'insight-detail': {
      const record = insights.find(item => item.id === route.recordId);
      return record ? <InsightDetailPage record={record} /> : <NotFoundPage />;
    }
    default: return <NotFoundPage />;
  }
}
