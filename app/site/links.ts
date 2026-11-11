import { assetUrl } from '../asset-url';
/** Pure shared path helper: callable from server and client compositions. */
export const siteHref = (path: string) => assetUrl(path.replace(/^\//, ''));
