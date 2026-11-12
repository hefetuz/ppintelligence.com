export const NEWSLETTER_DELAY = 6000;
export const NEWSLETTER_COOLDOWN = 30 * 24 * 60 * 60 * 1000;
export const NEWSLETTER_DISMISSED = 'pp:newsletter:dismissed:v1';
export const NEWSLETTER_SEEN = 'pp:newsletter:seen:v1';

export function shouldOfferNewsletter({ seen, dismissedAt, now = Date.now() }) {
  if (seen === '1') return false;
  const dismissed = Number(dismissedAt);
  return !Number.isFinite(dismissed) || dismissed <= 0 || now - dismissed >= NEWSLETTER_COOLDOWN;
}
