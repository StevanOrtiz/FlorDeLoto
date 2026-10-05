import type { APIRoute } from 'astro';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TURNSTILE_SECRET_KEY } from 'astro:env/server';
import { normalize, validate } from '../../lib/validation';

// Función de servidor (no se genera como estática).
export const prerender = false;

const MIN_FILL_MS = 3000; // un humano tarda más de 3 s en rellenar el formulario
const MAX_AGE_MS = 1000 * 60 * 60 * 24;
const RATE_LIMIT = 5; // envíos por IP y ventana
const WINDOW_MS = 1000 * 60 * 10;
const hits = new Map<string, number[]>(); // límite orientativo por instancia; en producción reforzarlo en Supabase

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

function rateLimited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > RATE_LIMIT;
}

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
  if (rateLimited(ip)) {
    return json({ ok: false, error: 'Has enviado varios mensajes seguidos. Inténtalo de nuevo en unos minutos.' }, 429);
  }
  if (!(await verifyTurnstile(String(raw['cf-turnstile-response'] ?? ''), ip))) {
    return json({ ok: false, error: 'No hemos podido verificar que no eres un robot. Recarga la página e inténtalo de nuevo.' }, 400);
  }

  const data = normalize(raw);
  const errors = validate(data);
  if (Object.keys(errors).length) return json({ ok: false, errors }, 422);

  // Guardado en Supabase (tabla contact_messages, ver supabase/schema.sql).
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        kind: data.kind,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono || null,
        asunto: data.asunto || null,
        tipo_evento: data.tipoEvento || null,
        fecha_evento: data.fecha || null,
        lugar: data.lugar || null,
        mensaje: data.mensaje,
        consentimiento: data.consentimiento,
        consentimiento_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      console.error('[contact] Supabase', res.status, await res.text());
      return json({ ok: false, error: 'No hemos podido enviar tu mensaje. Escríbenos por WhatsApp o llámanos.' }, 502);
    }
    return json({ ok: true });
  }

  // Sin base de datos configurada.
  if (import.meta.env.DEV) {
    console.info('[contact] (desarrollo, no se guarda)', { ...data, email: '***' });
    return json({ ok: true, dev: true });
  }
  return json({ ok: false, error: 'El formulario no está disponible en este momento. Escríbenos por WhatsApp o llámanos.' }, 503);
};

export const ALL: APIRoute = () => json({ ok: false, error: 'Método no permitido.' }, 405);
