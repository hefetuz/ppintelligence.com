export function siteConfiguration(env) {
  let origin = '';
  if (env.SITE_ORIGIN) {
    const url = new URL(env.SITE_ORIGIN);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      throw new Error('SITE_ORIGIN must be an HTTPS origin without a path.');
    origin = url.origin;
  }
  const indexable =
    env.ENABLE_INDEXING === 'true' &&
    (env.SITE_ENV ?? env.VERCEL_ENV) === 'production' &&
    !!origin &&
    !new URL(origin).hostname.endsWith('.vercel.app');
  if (env.ENABLE_INDEXING === 'true' && !indexable)
    throw new Error(
      'Indexing requires a production deployment and the approved custom SITE_ORIGIN.',
    );
  return {
    origin,
    indexable,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY ?? '',
    googleAnalyticsId: /^G-[A-Z0-9]+$/.test(env.GA_MEASUREMENT_ID ?? '')
      ? env.GA_MEASUREMENT_ID
      : '',
    searchConsoleVerification: /^[A-Za-z0-9_-]+$/.test(
      env.SEARCH_CONSOLE_VERIFICATION ?? '',
    )
      ? env.SEARCH_CONSOLE_VERIFICATION
      : '',
  };
}
