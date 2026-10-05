import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { json } from '../../../../../lib/admin-api';
import { sql, UUID_RE } from '../../../../../lib/db';
import { mediaUrl } from '../../../../../lib/catalog';

export const prerender = false;

const MAX_BYTES = 4 * 1024 * 1024; // Vercel limita el cuerpo de una función a 4,5 MB; el panel reduce las fotos antes de subirlas
const MAX_IMAGES = 12;

/** Subir una foto a un producto (multipart: `file` y `alt`). */
export const POST: APIRoute = async ({ params, request }) => {
  const productId = params.id ?? '';
  if (!UUID_RE.test(productId)) return json({ ok: false, error: 'Producto no encontrado.' }, 404);
  if (!request.headers.get('content-type')?.includes('multipart/form-data')) return json({ ok: false, error: 'Formato no válido.' }, 415);
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES + 100_000) return json({ ok: false, error: 'La foto pesa demasiado (máximo 4 MB).' }, 413);

  const [product] = await sql`select name, (select count(*)::int from product_images where product_id = ${productId}) as n from products where id = ${productId}`;
  if (!product) return json({ ok: false, error: 'Producto no encontrado.' }, 404);
  if (product.n >= MAX_IMAGES) return json({ ok: false, error: `Cada producto admite hasta ${MAX_IMAGES} fotos.` }, 422);

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return json({ ok: false, error: 'Elige una foto.' }, 422);
  if (file.size > MAX_BYTES) return json({ ok: false, error: 'La foto pesa demasiado (máximo 4 MB).' }, 413);

  const input = Buffer.from(await file.arrayBuffer());
  let full: Buffer, thumb: Buffer;
  try {
    const image = sharp(input, { limitInputPixels: 50_000_000, failOn: 'error' });
    // El formato se comprueba por el contenido del archivo, no por su extensión ni por el tipo que declara el navegador.
    const { format } = await image.metadata();
    if (!format || !['jpeg', 'png', 'webp'].includes(format)) return json({ ok: false, error: 'Solo se admiten fotos JPEG, PNG o WebP.' }, 415);
    // Se reconvierte siempre a WebP: así se descartan metadatos (ubicación GPS, etc.) y cualquier contenido extraño.
    full = await image.clone().rotate().resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    thumb = await image.clone().rotate().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
  } catch {
    return json({ ok: false, error: 'No se pudo leer la foto. Prueba con otro archivo.' }, 422);
  }

  const rawAlt = form.get('alt');
  const alt = (typeof rawAlt === 'string' ? rawAlt.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 200) : '') || product.name;

  const [row] = await sql`
    insert into product_images (product_id, position, alt, mime, data_full, data_thumb)
    values (${productId}, (select coalesce(max(position), -1) + 1 from product_images where product_id = ${productId}), ${alt}, 'image/webp', ${full}, ${thumb})
    returning id`;
  await sql`update products set updated_at = now() where id = ${productId}`;
  return json({ ok: true, image: { id: row.id, alt, src: mediaUrl(row.id), thumb: mediaUrl(row.id, 'thumb') } }, 201);
};
