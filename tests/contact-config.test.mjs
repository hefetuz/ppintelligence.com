import test from 'node:test';
import assert from 'node:assert/strict';
import { siteConfiguration } from '../scripts/site-config.mjs';

test('unconfigured static builds keep the existing mail draft fallback', () => {
  const config = siteConfiguration({});
  assert.equal(config.contactEndpoint, '');
  assert.equal(config.turnstileSiteKey, '');
});

test('only public endpoint and security site key enter the browser configuration', () => {
  const config = siteConfiguration({ CONTACT_ENDPOINT: 'https://mail.example.org/api/contact',
    TURNSTILE_SITE_KEY: 'public-site-key', RESEND_API_KEY: 'server-secret',
    TURNSTILE_SECRET_KEY: 'private-key' });
  assert.equal(config.contactEndpoint, 'https://mail.example.org/api/contact');
  assert.equal(config.turnstileSiteKey, 'public-site-key');
  assert.ok(!JSON.stringify(config).includes('server-secret'));
  assert.ok(!JSON.stringify(config).includes('private-key'));
});

test('build refuses insecure or credential-bearing mail endpoints', () => {
  for (const value of ['http://mail.example.org/contact', 'javascript:alert(1)',
    'https://user:secret@mail.example.org/contact', 'https://mail.example.org/contact?key=secret',
    'https://mail.example.org/contact#fragment'])
    assert.throws(() => siteConfiguration({ CONTACT_ENDPOINT: value }));
});
