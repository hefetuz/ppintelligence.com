import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldOfferNewsletter, NEWSLETTER_COOLDOWN } from '../app/site/newsletter-policy.mjs';

test('first visit is eligible, but no repeat in the same browser session', () => {
  assert.equal(shouldOfferNewsletter({ seen: null, dismissedAt: null }), true);
  assert.equal(shouldOfferNewsletter({ seen: '1', dismissedAt: null }), false);
});
test('dismissal suppresses offers for 30 days across sessions, including clock rollback', () => {
  const now = 1800000000000;
  assert.equal(shouldOfferNewsletter({ seen: null, dismissedAt: String(now), now: now + NEWSLETTER_COOLDOWN - 1 }), false);
  assert.equal(shouldOfferNewsletter({ seen: null, dismissedAt: String(now), now: now + NEWSLETTER_COOLDOWN }), true);
  assert.equal(shouldOfferNewsletter({ seen: null, dismissedAt: String(now), now: now - 1000 }), false);
  assert.equal(shouldOfferNewsletter({ seen: null, dismissedAt: 'invalid', now }), true);
});
