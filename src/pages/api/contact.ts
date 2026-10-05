import type { APIRoute } from 'astro';
import { TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { sql } from '../../lib/db';
import { hit } from '../../lib/ratelimit';
import { normalize, validate } from '../../lib/validation';

// Función de servidor (no se genera como estática).
export const prerender = false;

const MIN_FILL_MS = 3000; // un humano tarda más de 3 s en rellenar el formulario
const MAX_AGE_MS = 1000 * 60 * 60 * 24;
const RATE_LIMIT = 5; // envíos por IP y ventana
const WINDOW_SECONDS = 600;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

async function verifyTurnstile(token: string, ip: string) {
  if (!TURNSTILE_SECRET_KEY) return true; // Turnstile aún no configurado: quedan honeypot, tiempo y límite
  if (!token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Solo peticiones del propio sitio
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ ok: false, error: 'Origen no permitido.' }, 403);
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ ok: false, error: 'Formato no válido.' }, 415);
  }
  if (Number(request.headers.get('content-length') ?? 0) > 20_000) {
    return json({ ok: false, error: 'Mensaje demasiado largo.' }, 413);
  }

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: 'Formato no válido.' }, 400);
  }

  const ip = clientAddress ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // Anti-spam: honeypot y tiempo de relleno. A los bots se les responde "ok" para no darles pistas.
  const elapsed = Date.now() - Number(raw.ts);
  if (raw.website || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS || elapsed > MAX_AGE_MS) {
    return json({ ok: true });
  }
  const rate = await hit(`contact:${ip}`, RATE_LIMIT, WINDOW_SECONDS);
  if (!rate.ok) {
    return json(
      { ok: false, error: 'Has enviado varios mensajes seguidos. Inténtalo de nuevo en unos minutos.' },
      429,
      { 'Retry-After': String(rate.retryAfter) },
    );
  }
  if (!(await verifyTurnstile(String(raw['cf-turnstile-response'] ?? ''), ip))) {
    return json({ ok: false, error: 'No hemos podido verificar que no eres un robot. Recarga la página e inténtalo de nuevo.' }, 400);
  }

  const data = normalize(raw);
  const errors = validate(data);
  if (Object.keys(errors).length) return json({ ok: false, errors }, 422);

  try {
    await sql`
      insert into contact_messages (kind, nombre, email, telefono, asunto, tipo_evento, fecha_evento, lugar, mensaje, consentimiento, consentimiento_at)
      values (${data.kind}, ${data.nombre}, ${data.email}, ${data.telefono || null}, ${data.asunto || null}, ${data.tipoEvento || null},
              ${data.fecha || null}, ${data.lugar || null}, ${data.mensaje}, ${data.consentimiento}, now())`;
  } catch (e) {
    console.error('[contact] No se pudo guardar el mensaje', e);
    return json({ ok: false, error: 'No hemos podido enviar tu mensaje. Escríbenos por WhatsApp o llámanos.' }, 502);
  }
  return json({ ok: true });
};

export const ALL: APIRoute = () => json({ ok: false, error: 'Método no permitido.' }, 405);
