import type { APIRoute } from 'astro';
import { getSecret } from 'astro:env/server';
import { sql } from '../../lib/db';

export const prerender = false;

/** Comprobación de estado: dice si la web llega a la base de datos. No devuelve ningún dato ni secreto. */
export const GET: APIRoute = async () => {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (!getSecret('DATABASE_URL')) {
    return new Response(JSON.stringify({ ok: false, database: 'sin configurar' }), { status: 503, headers });
  }
  try {
    await sql`select 1`;
    return new Response(JSON.stringify({ ok: true, database: 'conectada' }), { headers });
  } catch (e) {
    console.error('[health] sin conexión con la base de datos', e);
    return new Response(JSON.stringify({ ok: false, database: 'sin conexión' }), { status: 503, headers });
  }
};
