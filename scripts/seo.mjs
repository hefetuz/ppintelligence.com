const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('"', '&quot;');
export function seoHead(pathname, metadata, content, config) {
  if (!config.origin || pathname === '/404.html') return '';
  const canonical = config.origin + pathname;
  const tags = [
    `<link rel="canonical" href="${escape(canonical)}" />`,
    `<meta property="og:type" content="${pathname.startsWith('/insights/') && pathname !== '/insights/' ? 'article' : 'website'}" />`,
    `<meta property="og:title" content="${escape(metadata.title)}" />`,
    `<meta property="og:description" content="${escape(metadata.description)}" />`,
    `<meta property="og:url" content="${escape(canonical)}" />`,
    '<meta property="og:site_name" content="Pretty Penny Intelligence" />',
    `<meta property="og:image" content="${config.origin}/media/scroll/penny-film-poster.webp" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
  ];
  if (config.searchConsoleVerification)
    tags.push(
      `<meta name="google-site-verification" content="${escape(config.searchConsoleVerification)}" />`,
    );
  const graph = [
    {
      '@type': 'Organization',
      '@id': config.origin + '/#organization',
      name: 'Pretty Penny Intelligence',
      url: config.origin,
      logo: config.origin + '/pp-logo.svg',
    },
  ];
  if (content.founder)
    graph.push({
      '@type': 'Person',
      '@id': config.origin + '/#founder',
      name: content.founder.name,
      jobTitle: content.founder.role,
      worksFor: { '@id': config.origin + '/#organization' },
    });
  const article = content.insights.find(
    (item) =>
      item.destination.kind === 'local' &&
      pathname === '/insights/' + item.destination.slug + '/',
  );
  if (article)
    graph.push({
      '@type': 'Article',
      headline: article.title,
      description: article.summary,
      mainEntityOfPage: canonical,
      author: { '@type': 'Person', name: article.attribution.name },
      ...(article.date ? { datePublished: article.date } : {}),
      publisher: { '@id': config.origin + '/#organization' },
    });
  tags.push(
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>`,
  );
  return tags.join('\n');
}
export function seoFiles(metadata, config) {
  const paths = Object.keys(metadata).filter(
    (path) => metadata[path].robots?.index && path !== '/404.html',
  );
  return {
    robots: config.indexable
      ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${config.origin}/sitemap.xml\n`
      : 'User-agent: *\nDisallow: /\n',
    sitemap:
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      paths
        .map((path) => `<url><loc>${escape(config.origin + path)}</loc></url>`)
        .join('') +
      '</urlset>\n',
  };
}
