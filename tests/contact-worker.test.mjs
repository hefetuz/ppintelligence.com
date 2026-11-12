import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../workers/contact.mjs';

test('worker has no unrelated routes or public configuration endpoint', async () => {
  for (const path of ['/', '/env', '/health', '/api/contact/extra'])
    assert.equal((await worker.fetch(new Request('https://mail.example.org' + path), {})).status, 404);
});

test('worker remains unavailable until production mail and security secrets exist', async () => {
  const response = await worker.fetch(new Request('https://mail.example.org/api/contact', {
    method: 'POST', headers: { origin: 'https://example.org', 'content-type': 'application/json',
      'idempotency-key': 'worker-test-123456789' }, body: JSON.stringify({
      name: 'QA', email: 'qa@example.org', company: '', topic: 'General enquiry', message: 'Local test.',
    }),
  }), { SITE_ORIGIN: 'https://example.org', RESEND_API_KEY: 'test',
    CONTACT_FROM: 'web@example.org', CONTACT_TO: 'owner@example.org' });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://example.org');
});
