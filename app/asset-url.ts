let staticAssetBase = '/';

export function setStaticAssetBase(base: string) {
  staticAssetBase = base.endsWith('/') ? base : base + '/';
}

export function assetUrl(path: string) {
  const base = typeof document === 'undefined' ? staticAssetBase : document.querySelector('base')?.getAttribute('href') || '/';
  return base + path.replace(/^\//, '');
}
