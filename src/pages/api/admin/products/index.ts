import type { APIRoute } from 'astro';
import { isUniqueViolation, json, readJson } from '../../../../lib/admin-api';
import { sql } from '../../../../lib/db';
import { parseProduct } from '../../../../lib/product-input';

export const prerender = false;

/** Crear producto. Las fotos se suben después, con /api/admin/products/[id]/images. */
export const POST: APIRoute = async ({ request }) => {
  const body = await readJson(request);
  if (!body) return json({ ok: false, error: 'Petición no válida.' }, 400);

  const { data: p, errors } = parseProduct(body);
  if (!errors.category_id) {
    const [cat] = await sql`select 1 from categories where id = ${p.category_id}`;
    if (!cat) errors.category_id = 'La categoría no existe.';
  }
  if (Object.keys(errors).length) return json({ ok: false, errors }, 422);

  try {
    const [row] = await sql`
      insert into products (slug, category_id, subcategory, name, description, composition, dimensions, care, watering, occasions, price, published, featured, sort_order)
      values (${p.slug}, ${p.category_id}, ${p.subcategory}, ${p.name}, ${p.description}, ${p.composition}, ${p.dimensions}, ${p.care},
              ${p.watering}, ${p.occasions}, ${p.price}, ${p.published}, ${p.featured},
              (select coalesce(max(sort_order), 0) + 1 from products where category_id = ${p.category_id}))
      returning id, slug`;
    return json({ ok: true, id: row.id, slug: row.slug }, 201);
  } catch (e) {
    if (isUniqueViolation(e)) return json({ ok: false, errors: { slug: 'Ya existe un producto con esa dirección (slug).' } }, 409);
    console.error('[admin] crear producto', e);
    return json({ ok: false, error: 'No se pudo guardar el producto.' }, 500);
  }
};
