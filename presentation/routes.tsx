import Home from '../app/page';
import { AboutPage, ContactPage, ExpertisePage, NotFoundPage } from '../app/site/pages';
import { pageMeta, resolvePath } from '../app/site/content';

export { pageMeta };
export { setStaticAssetBase } from '../app/asset-url';

export function Site({ pathname }: { pathname: string }) {
  switch (resolvePath(pathname)) {
    case '/': return <Home />;
    case '/expertise/': return <ExpertisePage />;
    case '/about/': return <AboutPage />;
    case '/contact/': return <ContactPage />;
    default: return <NotFoundPage />;
  }
}
