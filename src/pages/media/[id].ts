import type { APIRoute } from 'astro';
import { sql, UUID_RE } from '../../lib/db';

export const prerender = false;

const CACHE = 'public, max-age=31536000, immutable';

/** Sirve una foto del catálogo guardada en Neon. Cada subida tiene un id nuevo, así que el contenido de un id nunca cambia. */
export const GET: APIRoute = async ({ params, url, request }) => {
  const id = params.id ?? '';
  if (!UUID_RE.test(id)) return new Response('No encontrada', { status: 404 });

  const thumb = url.searchParams.get('s') === 'thumb';
  const etag = `"${id}${thumb ? '-t' : ''}"`;
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': CACHE } });
  }

  const rows = thumb
    ? await sql`select data_thumb as data, mime from product_images where id = ${id}`
    : await sql`select data_full as data, mime from product_images where id = ${id}`;
  const row = rows[0];
  if (!row) return new Response('No encontrada', { status: 404 });

  // El driver HTTP puede devolver bytea como Buffer o como texto hexadecimal («\x…»).
  const bytes: Uint8Array =
    typeof row.data === 'string' ? Buffer.from(row.data.replace(/^\\x/, ''), 'hex') : new Uint8Array(row.data);

  return new Response(bytes as unknown as BodyInit, {
    headers: {
      'Content-Type': row.mime,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': CACHE,
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
