/// <reference types="vite/client" />
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { useEffect } from 'react';
import '../app/globals.css';
import { routes } from '../app/site/content';
import { resolveSiteRoute } from '../app/site/routes';
import { Site } from './routes';
import { installBrandPreview } from '../app/site/brand-preview.mjs';

const disposeBrandPreview = installBrandPreview();
if (import.meta.hot) import.meta.hot.dispose(disposeBrandPreview);

const root = document.getElementById('root')!;
const base = new URL(document.baseURI).pathname;
const pathname = '/' + window.location.pathname.slice(base.length).replace(/^\//, '');
if (import.meta.env.DEV) {
  const route = resolveSiteRoute(pathname, routes);
  if (route) document.title = route.title;
}
function Presentation() {
  useEffect(() => {
    // The dev shell has no prerendered DOM when the browser first resolves a fragment.
    const fragment = window.location.hash.slice(1);
    if (!fragment) return;
    // HeroSection restores the initial fragment after its protected opening.
    if (document.querySelector('.site-home[data-entrance="intro"]')) {
      return;
    }
    try { document.getElementById(decodeURIComponent(fragment))?.scrollIntoView(); } catch { /* Malformed fragment: leave the page readable. */ }
  }, []);
  return <Site pathname={pathname} />;
}
const site = <Presentation />;
const existingRoot = import.meta.hot?.data.presentationRoot as Root | undefined;
const presentationRoot = existingRoot ?? (root.hasChildNodes() ? hydrateRoot(root, site) : createRoot(root));
if (existingRoot || !root.hasChildNodes()) presentationRoot.render(site);
if (import.meta.hot) import.meta.hot.data.presentationRoot = presentationRoot;
