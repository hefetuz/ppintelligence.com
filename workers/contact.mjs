import { handleContact } from '../server/contact.mjs';

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/contact')
      return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return handleContact(request, { env: { ...env, NODE_ENV: 'production' } });
  },
};
