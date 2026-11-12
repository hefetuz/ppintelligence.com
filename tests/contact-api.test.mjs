import test from 'node:test';
import assert from 'node:assert/strict';
import { handleContact, validateMessage } from '../server/contact.mjs';
const valid = {
  name: 'Example Visitor',
  email: 'visitor@example.org',
  company: 'Example',
  topic: 'General enquiry',
  message: 'A business question.',
  website: '',
  token: 'test-token',
};
const environment = {
  SITE_ORIGIN: 'https://example.org',
  RESEND_API_KEY: 'test-only',
  CONTACT_FROM: 'Website <web@example.org>',
  CONTACT_TO: 'owner@example.org',
  TURNSTILE_SECRET_KEY: 'test-only',
  VERCEL_ENV: 'production',
};
function request(changes = {}, origin = 'https://example.org', headers = {}) {
  return new Request('https://example.org/api/contact', {
    method: 'POST',
    headers: {
      origin,
      'Content-Type': 'application/json',
      'Idempotency-Key': '12345678-1234-1234-1234-123456789012',
      ...headers,
    },
    body: JSON.stringify({ ...valid, ...changes }),
  });
}
test('message validation rejects empty, oversize, header injection and honeypot input', () => {
  for (const change of [
    { name: '' },
    { email: 'wrong' },
    { email: 'visitor@example.org\r\nBcc: other@example.org' },
    { name: 'x\r\ny' },
    { company: 'x'.repeat(181) },
    { message: 'x'.repeat(5001) },
    { topic: 'Bcc' },
    { website: 'https://spam.example' },
  ])
    assert.equal(validateMessage({ ...valid, ...change }), null);
  assert.equal(validateMessage(valid).name, 'Example Visitor');
});
test('unconfigured contact never reports delivery or calls a provider', async () => {
  const result = await handleContact(request(), {
    env: { SITE_ORIGIN: 'https://example.org' },
    fetcher: () => assert.fail('Provider called'),
  });
  assert.equal(result.status, 503);
  assert.equal((await result.json()).accepted, undefined);
});
test('foreign origins, non-JSON and oversized requests cannot send mail', async () => {
  const options = {
    env: environment,
    fetcher: () => assert.fail('Provider called'),
  };
  assert.equal(
    (await handleContact(request({}, 'https://foreign.example'), options))
      .status,
    403,
  );
  assert.equal(
    (
      await handleContact(
        request({}, 'https://example.org', { 'Content-Type': 'text/plain' }),
        options,
      )
    ).status,
    415,
  );
  assert.equal(
    (await handleContact(request({ message: 'x'.repeat(25000) }), options))
      .status,
    413,
  );
  assert.equal(
    (
      await handleContact(
        new Request('https://example.org/api/contact'),
        options,
      )
    ).status,
    405,
  );
});
test('security verification checks hostname and action before Resend', async () => {
  for (const change of [
    { success: false },
    { hostname: 'foreign.example' },
    { action: 'login' },
  ]) {
    let calls = 0;
    const result = await handleContact(
      request({
        email: `security${JSON.stringify(change).length}@example.org`,
      }),
      {
        env: environment,
        fetcher: async (url) => {
          calls++;
          assert.match(url, /siteverify/);
          return Response.json({
            success: true,
            hostname: 'example.org',
            action: 'contact',
            ...change,
          });
        },
      },
    );
    assert.equal(result.status, 422);
    assert.equal(calls, 1);
  }
});
test('accepted messages use a fixed recipient, plain text and reply-to without exposing secrets', async () => {
  const calls = [];
  const result = await handleContact(
    request({
      email: 'success@example.org',
      message: '<script>not HTML</script>',
    }),
    {
      env: environment,
      fetcher: async (url, options) => {
        calls.push({ url, options });
        return Response.json(
          url.includes('siteverify')
            ? { success: true, action: 'contact', hostname: 'example.org' }
            : { id: 'mock-message-id' },
        );
      },
    },
  );
  assert.equal(result.status, 202);
  assert.deepEqual(await result.json(), { accepted: true });
  const body = JSON.parse(calls[1].options.body);
  assert.deepEqual(body.to, ['owner@example.org']);
  assert.equal(body.reply_to, 'success@example.org');
  assert.equal(body.html, undefined);
  assert.match(body.text, /<script>/);
  assert.match(calls[1].options.headers['Idempotency-Key'], /^contact-/);
});
test('provider failures and network errors preserve an honest error response', async () => {
  for (const throwing of [false, true]) {
    const result = await handleContact(
      request({ email: `failure${throwing}@example.org` }),
      {
        env: environment,
        fetcher: async (url) => {
          if (url.includes('siteverify'))
            return Response.json({
              success: true,
              action: 'contact',
              hostname: 'example.org',
            });
          if (throwing) throw new Error('secret upstream details');
          return Response.json(
            { error: 'secret upstream details' },
            { status: 500 },
          );
        },
      },
    );
    assert.equal(result.status, 502);
    assert.ok(!(await result.text()).includes('secret upstream'));
  }
});
test('repeated submissions are throttled within the function instance', async () => {
  const options = {
    env: environment,
    fetcher: async (url) =>
      Response.json(
        url.includes('siteverify')
          ? { success: true, action: 'contact', hostname: 'example.org' }
          : { id: 'mock' },
      ),
    now: () => 123456,
  };
  for (let i = 0; i < 3; i++)
    assert.equal(
      (await handleContact(request({ email: 'rate@example.org' }), options))
        .status,
      202,
    );
  const result = await handleContact(
    request({ email: 'rate@example.org' }),
    options,
  );
  assert.equal(result.status, 429);
  assert.equal(result.headers.get('Retry-After'), '900');
});

test('cross-origin preflight allows only the website, POST and required headers', async () => {
  const preflight = (origin, method = 'POST', headers = 'content-type,idempotency-key') =>
    new Request('https://mail.example.net/api/contact', {
      method: 'OPTIONS', headers: { origin, 'access-control-request-method': method,
        'access-control-request-headers': headers },
    });
  const options = { env: environment, fetcher: () => assert.fail('Preflight sent mail') };
  const accepted = await handleContact(preflight('https://example.org'), options);
  assert.equal(accepted.status, 204);
  assert.equal(accepted.headers.get('Access-Control-Allow-Origin'), 'https://example.org');
  assert.equal(accepted.headers.get('Vary'), 'Origin');
  assert.equal(accepted.headers.get('Access-Control-Allow-Credentials'), null);
  for (const denied of [preflight('https://other.example'), preflight('https://example.org', 'DELETE'),
    preflight('https://example.org', 'POST', 'authorization')]) {
    const response = await handleContact(denied, options);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
});

test('browser can read validation and provider errors from the separate function', async () => {
  for (const [changes, expected] of [[{ email: '' }, 422], [{ email: 'cors-error@example.org' }, 502]]) {
    const response = await handleContact(request(changes), { env: environment,
      fetcher: async url => url.includes('siteverify')
        ? Response.json({ success: true, action: 'contact', hostname: 'example.org' })
        : Response.json({ error: 'private upstream detail' }, { status: 500 }) });
    assert.equal(response.status, expected);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://example.org');
    assert.ok(!(await response.text()).includes('private upstream detail'));
  }
});

test('edge rate limiter receives hashed email and blocks mail when unavailable or exhausted', async () => {
  for (const fails of [false, true]) {
    const response = await handleContact(request({ email: `edge${fails}@example.org` }), {
      env: { ...environment, CONTACT_RATE_LIMITER: { limit: async ({ key }) => {
        assert.match(key, /^[a-f0-9]{64}$/);
        if (fails) throw new Error('private backend failure');
        return { success: false };
      } } }, fetcher: () => assert.fail('Throttled request sent mail'),
    });
    assert.equal(response.status, fails ? 503 : 429);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://example.org');
    assert.ok(!(await response.text()).includes('private backend failure'));
  }
});
