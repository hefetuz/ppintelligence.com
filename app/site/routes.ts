import type { BaseSitePath, PublicContent } from './content-types';

export type SiteRoute = {
  path: string;
  kind:
    | 'home'
    | 'expertise'
    | 'company'
    | 'insights'
    | 'contact'
    | 'expertise-detail'
    | 'insight-detail';
  active: BaseSitePath;
  title: string;
  description: string;
  noindex: boolean;
  recordId?: string;
};
export type RouteRegistry = Record<string, SiteRoute>;
const BRAND = 'Pretty Penny Intelligence';
/** Canonical public destinations shared by navigation and the footer.
 * The short service fragments are established public URLs and stay stable. */
export const sitePlan = {
  home: { path: '/', label: 'Home' },
  company: { path: '/about/', label: 'About' },
  insights: { path: '/insights/', label: 'Insights' },
  contact: { path: '/contact/', label: 'Contact' },
  strategy: { path: '/#strategy', label: 'Business strategy' },
  risk: { path: '/#risk', label: 'Risk management' },
  economics: { path: '/#economics', label: 'Economic analysis' },
  founder: { path: '/about/#meet-deniz', label: 'Meet Deniz' },
  publications: { path: '/insights/#publications', label: 'All publications' },
} as const;
export function normalizePath(pathname: string): string | null {
  try {
    const decoded = decodeURIComponent(pathname.split(/[?#]/)[0]);
    const parts = decoded.split('/').filter(Boolean);
    for (let index = 0; index < decoded.length; index++)
      if (decoded.charCodeAt(index) < 32) return null;
    if (
      parts.some((part) => part === '.' || part === '..') ||
      decoded.includes('\\')
    )
      return null;
    return '/' + parts.join('/') + (parts.length ? '/' : '');
  } catch {
    return null;
  }
}
export function createRouteRegistry(content: PublicContent): RouteRegistry {
  const base: [BaseSitePath, SiteRoute['kind'], string, string][] = [
    [
      '/',
      'home',
      BRAND + ' | Make every penny count.',
      'Business consulting focused on business strategy, risk management and economic analysis.',
    ],
    [
      '/expertise/',
      'expertise',
      'Expertise has moved | ' + BRAND,
      'Our connected expertise now lives on the homepage.',
    ],
    [
      '/about/',
      'company',
      sitePlan.company.label + ' | ' + BRAND,
      'Meet Pretty Penny Intelligence and founder Deniz K. Tudor: independent advice, grounded in experience.',
    ],
    [
      '/insights/',
      'insights',
      'Insights | ' + BRAND,
      'Writing, research and published work on risk, finance and economic analysis.',
    ],
    [
      '/contact/',
      'contact',
      'Contact | ' + BRAND,
      'Start a conversation about your business, your priorities and your next move.',
    ],
  ];
  const registry: RouteRegistry = {};
  for (const [path, kind, title, description] of base)
    registry[path] = {
      path,
      kind,
      title,
      description,
      active: path,
      noindex:
        kind === 'expertise' ||
        (kind === 'insights' && content.insights.length === 0),
    };
  const add = (route: SiteRoute) => {
    if (registry[route.path]) throw new Error('Duplicate route: ' + route.path);
    registry[route.path] = route;
  };
  for (const record of content.expertise)
    if (record.slug)
      add({
        path: '/expertise/' + record.slug + '/',
        kind: 'expertise-detail',
        active: '/expertise/',
        title: record.name + ' | ' + BRAND,
        description: record.summary,
        recordId: record.id,
        noindex: true,
      });
  for (const record of content.insights)
    if (record.destination.kind === 'local')
      add({
        path: '/insights/' + record.destination.slug + '/',
        kind: 'insight-detail',
        active: '/insights/',
        title: record.title + ' | ' + BRAND,
        description: record.summary,
        recordId: record.id,
        noindex: false,
      });
  return registry;
}
export function resolveSiteRoute(pathname: string, registry: RouteRegistry) {
  const path = normalizePath(pathname);
  return path && Object.hasOwn(registry, path) ? registry[path] : null;
}
export function publicNavigation(
  registry: RouteRegistry,
  _content: PublicContent,
) {
  const items: { path: string; label: string }[] = [
    sitePlan.home,
    sitePlan.company,
  ];
  if (registry[sitePlan.insights.path]) items.push(sitePlan.insights);
  items.push(sitePlan.contact);
  return items;
}
export function legacyExpertiseTarget(hash = '') {
  const targets: Record<string, string> = {
    '#strategy': '/#strategy',
    '#risk': '/#risk',
    '#economics': '/#economics',
    '#technology': '/#economics',
    '#economic-analysis': '/#economics',
  };
  return targets[hash] ?? '/#expertise-heading';
}
