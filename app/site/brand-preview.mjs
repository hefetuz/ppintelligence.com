/** URL-scoped presentation theme: no storage, no server state, no change to the default. */
export function brandPreviewHref(href, currentHref, baseHref) {
  const current = new URL(currentHref);
  const heritage = current.searchParams.get('theme') === 'heritage';
  const palettePreview = current.searchParams.get('preview') === 'palette';
  if (!heritage && !palettePreview) return href;
  const target = new URL(href, current);
  const base = new URL(baseHref);
  if (target.origin !== current.origin || !target.pathname.startsWith(base.pathname)) return href;
  const relative = target.pathname.slice(base.pathname.length);
  if (relative.startsWith('experiments/') || (!target.pathname.endsWith('/') && !target.pathname.endsWith('/404.html'))) return href;
  if (heritage) target.searchParams.set('theme', 'heritage');
  if (palettePreview) target.searchParams.set('preview', 'palette');
  return target.href;
}

export function installBrandPreview() {
  const query = new URLSearchParams(location.search);
  const heritage = query.get('theme') === 'heritage';
  const palettePreview = query.get('preview') === 'palette';
  if (!heritage && !palettePreview) return () => {};
  if (heritage) {
    document.documentElement.dataset.brand = 'heritage';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#082b5c');
  }
  if (palettePreview) document.documentElement.dataset.preview = 'palette';
  // Keep SSR links unchanged until interaction, avoiding hydration mismatches.
  // Pointer/focus also cover copy-link, context-menu and modified-click navigation.
  const retainTheme = event => {
    const target = event.target;
    const link = target instanceof Element ? target.closest('a[href]') : null;
    if (!link || link.hasAttribute('download') || link.hasAttribute('data-exit-preview')) return;
    const href = link.getAttribute('href');
    const next = brandPreviewHref(href, location.href, document.baseURI);
    if (next !== href) link.setAttribute('href', next);
  };
  const events = ['pointerdown', 'focusin', 'click'];
  events.forEach(type => document.addEventListener(type, retainTheme, true));
  return () => events.forEach(type => document.removeEventListener(type, retainTheme, true));
}
