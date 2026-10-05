import type { APIRoute } from 'astro';
import { isUniqueViolation, json, readJson } from '../../../../lib/admin-api';
import { sql, UUID_RE } from '../../../../lib/db';
import { parseProduct } from '../../../../lib/product-input';

export const prerender = false;

/** Editar producto. */
export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id ?? '';
  if (!UUID_RE.test(id)) return json({ ok: false, error: 'Producto no encontrado.' }, 404);
  const body = await readJson(request);
  if (!body) return json({ ok: false, error: 'Petición no válida.' }, 400);

  const { data: p, errors } = parseProduct(body);
  if (!errors.category_id) {
    const [cat] = await sql`select 1 from categories where id = ${p.category_id}`;
    if (!cat) errors.category_id = 'La categoría no existe.';
  }
  if (Object.keys(errors).length) return json({ ok: false, errors }, 422);

  try {
    const rows = await sql`
      update products set slug = ${p.slug}, category_id = ${p.category_id}, subcategory = ${p.subcategory}, name = ${p.name},
             description = ${p.description}, composition = ${p.composition}, dimensions = ${p.dimensions}, care = ${p.care},
             watering = ${p.watering}, occasions = ${p.occasions}, price = ${p.price}, published = ${p.published},
             featured = ${p.featured}, updated_at = now()
       where id = ${id} returning id, slug`;
    if (!rows[0]) return json({ ok: false, error: 'Producto no encontrado.' }, 404);
    return json({ ok: true, id: rows[0].id, slug: rows[0].slug });
  } catch (e) {
    if (isUniqueViolation(e)) return json({ ok: false, errors: { slug: 'Ya existe otro producto con esa dirección (slug).' } }, 409);
    console.error('[admin] editar producto', e);
    return json({ ok: false, error: 'No se pudo guardar el producto.' }, 500);
  }
};

/** Borrar producto (sus fotos se borran con él). */
export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id ?? '';
  if (!UUID_RE.test(id)) return json({ ok: false, error: 'Producto no encontrado.' }, 404);
  const rows = await sql`delete from products where id = ${id} returning id`;
  return rows[0] ? json({ ok: true }) : json({ ok: false, error: 'Producto no encontrado.' }, 404);
};
