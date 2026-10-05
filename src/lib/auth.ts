import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { sql } from './db';
import { hit } from './ratelimit';

/** En producción la cookie lleva el prefijo __Host- (obliga a Secure, Path=/ y sin Domain). En local no hay HTTPS. */
export const COOKIE_NAME = import.meta.env.PROD ? '__Host-fdl_admin' : 'fdl_admin';
export const SESSION_HOURS = 8; // la sesión se renueva con cada petición…
export const SESSION_MAX_HOURS = 24; // …pero nunca dura más de un día

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export interface AdminSession {
  email: string;
  /** Token anti-CSRF ligado a esta sesión; se envía en la cabecera `x-csrf-token` en cada cambio. */
  csrf: string;
}

// ───────── Sesiones ─────────
// El token que recibe el navegador es aleatorio (256 bits). En la base de datos solo se guarda su hash:
// quien lea la tabla no puede entrar con él.

export async function createSession(ip: string, userAgent: string) {
  const token = randomBytes(32).toString('base64url');
  await sql`delete from admin_sessions where expires_at < now()`;
  await sql`insert into admin_sessions (token_hash, expires_at, ip, user_agent)
            values (${sha256(token)}, now() + make_interval(hours => ${SESSION_HOURS}), ${ip}, ${userAgent.slice(0, 300)})`;
  return token;
}

export async function getSession(token: string | undefined): Promise<AdminSession | null> {
  if (!token || !TOKEN_RE.test(token)) return null;
  const rows = await sql`
    with s as (
      update admin_sessions
         set expires_at = least(created_at + make_interval(hours => ${SESSION_MAX_HOURS}), now() + make_interval(hours => ${SESSION_HOURS}))
       where token_hash = ${sha256(token)}
         and expires_at > now()
         and created_at > now() - make_interval(hours => ${SESSION_MAX_HOURS})
      returning 1)
    select u.email from admin_users u where exists (select 1 from s)`;
  if (!rows[0]) return null;
  return { email: rows[0].email as string, csrf: csrfFor(token) };
}

export async function destroySession(token: string | undefined) {
  if (token && TOKEN_RE.test(token)) await sql`delete from admin_sessions where token_hash = ${sha256(token)}`;
}

// ───────── CSRF ─────────
export const csrfFor = (token: string) => createHmac('sha256', token).update('fdl-csrf').digest('hex');

export function csrfOk(token: string | undefined, provided: string | null | undefined) {
  if (!token || !provided) return false;
  const a = Buffer.from(csrfFor(token));
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** El Origin de la petición debe ser el del propio sitio. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

// ───────── Límite de intentos de acceso ─────────
// Bloqueo por IP (no por cuenta): bloquear la cuenta permitiría a cualquiera dejar fuera al administrador
// fallando a propósito. 5 fallos en 15 minutos bloquean esa IP 15 min, luego 30 y luego 60.
const MAX_FAILS = 5;
const WINDOW_MIN = 15;

/** Segundos que le quedan de bloqueo a esta IP (0 si puede intentarlo). */
export async function loginLockRemaining(ip: string): Promise<number> {
  const [row] = await sql`select greatest(0, ceil(extract(epoch from (locked_until - now()))))::int as left
                          from rate_limits where key = ${'login:' + ip} and locked_until > now()`;
  return row?.left ?? 0;
}

export async function recordLoginFailure(ip: string) {
  const key = 'login:' + ip;
  const [row] = await sql`select count, window_start < now() - make_interval(mins => ${WINDOW_MIN}) as stale, locked_until is not null as had_lock
                          from rate_limits where key = ${key}`;
  const count = row && !row.stale ? row.count + 1 : 1;
  const lockMinutes = count >= MAX_FAILS ? Math.min(60, 15 * 2 ** (count - MAX_FAILS)) : null;
  await sql`
    insert into rate_limits (key, window_start, count, locked_until)
    values (${key}, now(), ${count}, case when ${lockMinutes}::int is null then null else now() + make_interval(mins => ${lockMinutes}::int) end)
    on conflict (key) do update set
      window_start = case when ${row ? !row.stale : false} then rate_limits.window_start else now() end,
      count = ${count},
      locked_until = case when ${lockMinutes}::int is null then null else now() + make_interval(mins => ${lockMinutes}::int) end`;
  // Freno global: si hay muchos fallos seguidos (ataque distribuido), cada intento fallido tarda más en responder.
  const global = await hit('login-fail-global', 20, 3600);
  if (!global.ok) await new Promise((r) => setTimeout(r, 2500));
}

export async function clearLoginFailures(ip: string) {
  await sql`delete from rate_limits where key = ${'login:' + ip}`;
}
