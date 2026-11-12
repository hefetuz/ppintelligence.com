import { createHash } from 'node:crypto';
const TOPICS = new Set([
  'General enquiry',
  'Business strategy',
  'Risk management',
  'Economic analysis',
  'Writing & publications',
  'Speaking invitation',
]);
const email = (value) =>
  typeof value === 'string' &&
  /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value) &&
  !/[\r\n]/.test(value);
const reply = (status, error, headers = {}) =>
  Response.json(error ? { error } : { accepted: true }, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
const attempts = new Map();
export function validateMessage(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const field = (key, max, required = true) =>
    typeof data[key] === 'string' &&
    data[key].trim().length <= max &&
    (!required || data[key].trim())
      ? data[key].trim()
      : null;
  const name = field('name', 120),
    address = field('email', 254),
    company = data.company === undefined ? '' : field('company', 180, false),
    message = field('message', 5000);
  if (
    !name ||
    company === null ||
    /[\r\n]/.test(name) ||
    !email(address) ||
    !message ||
    !TOPICS.has(data.topic) ||
    (data.website && String(data.website).trim())
  )
    return null;
  return { name, email: address, company, topic: data.topic, message };
}
/** Shared by the deployed function and local QA. Recipient is server controlled. */
async function processContact(
  request,
  { env = process.env, fetcher = fetch, now = Date.now } = {},
) {
  if (request.method !== 'POST')
    return reply(405, 'Use the contact form to send a message.', {
      Allow: 'POST',
    });
  const origin = request.headers.get('origin');
  const allowed = [
    env.SITE_ORIGIN,
    ...(env.CONTACT_ALLOWED_ORIGINS ?? '').split(','),
    env.VERCEL_URL && `https://${env.VERCEL_URL}`,
  ]
    .filter(Boolean)
    .map((value) => value.trim().replace(/\/$/, ''));
  if (env.NODE_ENV !== 'production' && !env.VERCEL_ENV)
    allowed.push(
      'http://127.0.0.1:4173',
      'http://127.0.0.1:4174',
      'http://localhost:4173',
    );
  if (!origin || !allowed.includes(origin))
    return reply(403, 'Please send your message from this website.');
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return reply(415, 'Unsupported message format.');
  if (Number(request.headers.get('content-length')) > 24000)
    return reply(413, 'Your message is too long.');
  let data;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, 'Please complete the form.');
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 24000) {
        await reader.cancel();
        return reply(413, 'Your message is too long.');
      }
      chunks.push(value);
    }
    data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return reply(400, 'Please complete the form and try again.');
  }
  const message = validateMessage(data);
  if (!message)
    return reply(422, 'Please check your name, email address and message.');
  const id = request.headers.get('idempotency-key');
  if (!id || !/^[a-zA-Z0-9-]{16,80}$/.test(id))
    return reply(400, 'Please reload the page and try again.');
  const production =
    env.VERCEL_ENV === 'production' || env.NODE_ENV === 'production';
  if (
    !env.RESEND_API_KEY ||
    !env.CONTACT_FROM ||
    !email(env.CONTACT_TO) ||
    (production && !env.TURNSTILE_SECRET_KEY)
  )
    return reply(
      503,
      'Online messaging is temporarily unavailable. Please use the email link below.',
    );
  const key = createHash('sha256')
      .update(message.email.toLowerCase())
      .digest('hex'),
    stamp = now();
  if (env.CONTACT_RATE_LIMITER) {
    try {
      const { success } = await env.CONTACT_RATE_LIMITER.limit({ key });
      if (!success)
        return reply(429, 'Please wait a minute before trying again.', { 'Retry-After': '60' });
    } catch {
      return reply(503, 'Online messaging is temporarily unavailable. Please try again shortly.');
    }
  }
  for (const [address, entry] of attempts)
    if (stamp - entry.start > 900000) attempts.delete(address);
  const entry = attempts.get(key) ?? { start: stamp, count: 0 };
  if (entry.count >= 3)
    return reply(429, 'Please wait a few minutes before trying again.', {
      'Retry-After': '900',
    });
  if (attempts.size >= 1000 && !attempts.has(key))
    return reply(429, 'Please try again shortly.');
  entry.count++;
  attempts.set(key, entry);
  try {
    if (env.TURNSTILE_SECRET_KEY) {
      if (
        typeof data.token !== 'string' ||
        data.token.length > 2048 ||
        !data.token
      )
        return reply(422, 'Please complete the security check.');
      const verification = await fetcher(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET_KEY,
            response: data.token,
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      const result = await verification.json();
      if (
        !verification.ok ||
        !result.success ||
        result.action !== 'contact' ||
        result.hostname !== new URL(origin).hostname
      )
        return reply(422, 'The security check expired. Please try again.');
    }
    const sent = await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `contact-${id}`,
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: message.email,
        subject: `Website enquiry: ${message.topic}`,
        text: `Name: ${message.name}\nEmail: ${message.email}\nCompany: ${message.company || '—'}\nTopic: ${message.topic}\n\n${message.message}`,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!sent.ok)
      return reply(
        502,
        'Your message could not be submitted. Please try again or email us.',
      );
    const result = await sent.json();
    if (!result.id)
      return reply(
        502,
        'Your message could not be confirmed. Please use email.',
      );
    return reply(202);
  } catch {
    return reply(
      502,
      'We could not connect to the mail service. Your message is still here; please try again or email us.',
    );
  }
}

// GitHub Pages and the mail function have different origins. Only approved
// website origins receive CORS headers, including on validation/provider errors.
export async function handleContact(request, options = {}) {
  const env = options.env ?? process.env;
  const origin = request.headers.get('origin');
  const allowed = [env.SITE_ORIGIN, ...(env.CONTACT_ALLOWED_ORIGINS ?? '').split(','),
    env.VERCEL_URL && `https://${env.VERCEL_URL}`]
    .filter(Boolean).map(value => value.trim().replace(/\/$/, ''));
  if (env.NODE_ENV !== 'production' && !env.VERCEL_ENV)
    allowed.push('http://127.0.0.1:4173', 'http://127.0.0.1:4174', 'http://localhost:4173');
  const trusted = !!origin && allowed.includes(origin);
  const headers = trusted ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Idempotency-Key',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  } : {};
  if (request.method === 'OPTIONS') {
    const requestedHeaders = (request.headers.get('access-control-request-headers') ?? '')
      .toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
    if (!trusted || request.headers.get('access-control-request-method') !== 'POST' ||
      requestedHeaders.some(value => !['content-type', 'idempotency-key'].includes(value)))
      return reply(403, 'Please send your message from this website.');
    return new Response(null, { status: 204, headers: { ...headers, 'Cache-Control': 'no-store' } });
  }
  const response = await processContact(request, options);
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
}
