import type { APIRoute } from 'astro';
import { json, readJson } from '../../../../lib/admin-api';
import { sql, UUID_RE } from '../../../../lib/db';

export const prerender = false;

/** Cambiar el texto alternativo de una foto o moverla ({ move: 'up' | 'down' }). */
export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id ?? '';
  if (!UUID_RE.test(id)) return json({ ok: false, error: 'Foto no encontrada.' }, 404);
  const body = await readJson(request, 2000);
  if (!body) return json({ ok: false, error: 'Petición no válida.' }, 400);

  const [img] = await sql`select product_id from product_images where id = ${id}`;
  if (!img) return json({ ok: false, error: 'Foto no encontrada.' }, 404);

  if (typeof body.alt === 'string') {
    const alt = body.alt.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 200);
    await sql`update product_images set alt = ${alt} where id = ${id}`;
  }

  if (body.move === 'up' || body.move === 'down') {
    const rows = await sql`select id from product_images where product_id = ${img.product_id} order by position, created_at`;
    const ids = rows.map((r) => r.id as string);
    const i = ids.indexOf(id);
    const j = body.move === 'up' ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < ids.length) {
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await sql`update product_images pi set position = u.pos
                from unnest(${ids}::uuid[], ${ids.map((_, k) => k)}::int[]) as u(id, pos)
                where pi.id = u.id`;
    }
  }

  await sql`update products set updated_at = now() where id = ${img.product_id}`;
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  if (!UUID_RE.test(id)) return json({ ok: false, error: 'Foto no encontrada.' }, 404);
  const rows = await sql`delete from product_images where id = ${id} returning product_id`;
  if (!rows[0]) return json({ ok: false, error: 'Foto no encontrada.' }, 404);
  await sql`update products set updated_at = now() where id = ${rows[0].product_id}`;
  return json({ ok: true });
};
