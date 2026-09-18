import { createRoot, hydrateRoot } from 'react-dom/client';
import '../app/globals.css';
import { Site } from './routes';

const root = document.getElementById('root')!;
const base = new URL(document.baseURI).pathname;
const pathname = '/' + window.location.pathname.slice(base.length).replace(/^\//, '');
const site = <Site pathname={pathname} />;
if (root.hasChildNodes()) hydrateRoot(root, site);
else createRoot(root).render(site);
