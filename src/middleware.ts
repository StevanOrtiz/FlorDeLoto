import { defineMiddleware } from 'astro:middleware';
import { COOKIE_NAME, csrfOk, getSession, sameOrigin } from './lib/auth';

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/api/admin/login']);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

/**
 * Protege /admin y /api/admin:
 *  - sin sesión válida: las páginas redirigen al login y la API responde 401;
 *  - en peticiones que cambian datos exige Origin del propio sitio y token CSRF;
 *  - todas las respuestas del panel salen con no-store y noindex.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isApi = pathname.startsWith('/api/admin/');
  const isPage = pathname === '/admin' || pathname.startsWith('/admin/');
  if (!isApi && !isPage) return next();

  const { request, cookies } = context;
  const unsafe = !SAFE_METHODS.has(request.method);
  let response: Response;

  if (unsafe && !sameOrigin(request)) {
    response = json({ ok: false, error: 'Origen no permitido.' }, 403);
  } else if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    response = await next();
  } else {
    const token = cookies.get(COOKIE_NAME)?.value;
    const session = await getSession(token);
    if (!session) {
      response = isApi ? json({ ok: false, error: 'Sesión caducada. Vuelve a iniciar sesión.' }, 401) : context.redirect('/admin/login', 302);
    } else if (unsafe && !csrfOk(token, request.headers.get('x-csrf-token'))) {
      response = json({ ok: false, error: 'Petición no válida (CSRF). Recarga la página.' }, 403);
    } else {
      context.locals.admin = session;
      response = await next();
    }
  }

  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
});
