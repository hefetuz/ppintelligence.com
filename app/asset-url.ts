/** Respect a static presentation's subdirectory without changing Sites routes. */
export function assetUrl(path: string) {
  const base = typeof document === 'undefined' ? '/' : document.querySelector('base')?.getAttribute('href') || '/';
  return base + path.replace(/^\//, '');
}
