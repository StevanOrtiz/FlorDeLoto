import type { APIRoute } from 'astro';
import { COOKIE_NAME, destroySession } from '../../../lib/auth';
import { json } from '../../../lib/admin-api';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  await destroySession(cookies.get(COOKIE_NAME)?.value);
  cookies.delete(COOKIE_NAME, { path: '/' });
  return json({ ok: true });
};
