import type { APIRoute } from 'astro';
import { COOKIE_NAME, SESSION_HOURS, clearLoginFailures, createSession, loginLockRemaining, recordLoginFailure } from '../../../lib/auth';
import { json, readJson } from '../../../lib/admin-api';
import { sql } from '../../../lib/db';
import { dummyHash, verifyPassword } from '../../../lib/password';

export const prerender = false;

const GENERIC = 'Correo o contraseña incorrectos.';

// Se calcula al cargar el módulo para que el primer intento con un correo inexistente no tarde más que los demás.
void dummyHash();

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const body = await readJson(request, 2000);
  if (!body) return json({ ok: false, error: 'Petición no válida.' }, 400);

  const ip = clientAddress ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const locked = await loginLockRemaining(ip);
  if (locked > 0) {
    return json(
      { ok: false, error: `Demasiados intentos fallidos. Inténtalo de nuevo en ${Math.ceil(locked / 60)} minutos.` },
      429,
      { 'Retry-After': String(locked) },
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 200) : '';
  const password = typeof body.password === 'string' ? body.password.slice(0, 300) : '';

  const [user] = await sql`select email, password_hash from admin_users where email = ${email}`;
  // Siempre se calcula un hash (real o falso): el tiempo de respuesta no revela si el correo existe.
  const ok = await verifyPassword(password, user?.password_hash ?? (await dummyHash()));

  if (!user || !ok) {
    await recordLoginFailure(ip);
    return json({ ok: false, error: GENERIC }, 401);
  }

  await clearLoginFailures(ip);
  const token = await createSession(ip, request.headers.get('user-agent') ?? '');
  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
  return json({ ok: true });
};
