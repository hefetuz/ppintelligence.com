import { handleContact } from '../../../server/contact.mjs';
export const onRequest = ({ request, env }) =>
  handleContact(request, { env: { ...env, NODE_ENV: 'production' } });
