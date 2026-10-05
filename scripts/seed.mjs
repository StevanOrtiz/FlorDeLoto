// Carga el catálogo inicial (db/seed/catalog.json + db/seed/images) en Neon.
//
// Uso:  npm run db:seed              (crea o actualiza categorías y productos; no toca fotos ya cargadas)
//       npm run db:seed -- --force   (vuelve a cargar también las fotos de cada producto)
//
// Necesita DATABASE_URL (archivo .env en local). Es idempotente.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { neon } from '@neondatabase/serverless';

const ROOT = path.resolve(import.meta.dirname, '..');
const SEED = path.join(ROOT, 'db/seed');
const force = process.argv.includes('--force');

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL. Ejecuta con: npm run db:seed');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
const { categories, products } = JSON.parse(await fs.readFile(path.join(SEED, 'catalog.json'), 'utf8'));

// 1) Categorías
for (const c of categories) {
  await sql`
    insert into categories (id, name, short, path, title, description, intro, sort_order)
    values (${c.id}, ${c.name}, ${c.short}, ${c.path}, ${c.title}, ${c.description}, ${c.intro}, ${c.sort_order})
    on conflict (id) do update set name = excluded.name, short = excluded.short, path = excluded.path,
      title = excluded.title, description = excluded.description, intro = excluded.intro, sort_order = excluded.sort_order`;
}
console.log(`Categorías: ${categories.length}`);

// 2) Productos e imágenes
let imgCount = 0, skipped = 0;
for (const p of products) {
  const [row] = await sql`
    insert into products (slug, category_id, subcategory, name, description, composition, dimensions, care, watering, occasions, price, published, featured, sort_order)
    values (${p.slug}, ${p.category_id}, ${p.subcategory}, ${p.name}, ${p.description}, ${p.composition}, ${p.dimensions},
            ${p.care}, ${p.watering}, ${p.occasions}, ${p.price}, ${p.published}, ${p.featured}, ${p.sort_order})
    on conflict (slug) do update set category_id = excluded.category_id, subcategory = excluded.subcategory, name = excluded.name,
      description = excluded.description, composition = excluded.composition, dimensions = excluded.dimensions, care = excluded.care,
      watering = excluded.watering, occasions = excluded.occasions, price = excluded.price, featured = excluded.featured, sort_order = excluded.sort_order,
      updated_at = now()
    returning id`;

  const [{ n }] = await sql`select count(*)::int as n from product_images where product_id = ${row.id}`;
  if (n > 0 && !force) { skipped += p.images.length; continue; }

  const rows = [];
  for (const [i, file] of p.images.entries()) {
    const full = await fs.readFile(path.join(SEED, 'images', file));
    const thumb = await sharp(full).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
    rows.push({ position: i, alt: i === 0 ? p.name : `${p.name}, vista ${i + 1}`, full, thumb });
  }
  await sql.transaction([
    sql`delete from product_images where product_id = ${row.id}`,
    ...rows.map((r) => sql`insert into product_images (product_id, position, alt, mime, data_full, data_thumb)
                           values (${row.id}, ${r.position}, ${r.alt}, 'image/webp', ${r.full}, ${r.thumb})`),
  ]);
  imgCount += rows.length;
  process.stdout.write('.');
}

const [t] = await sql`select (select count(*)::int from categories) c, (select count(*)::int from products) p, (select count(*)::int from product_images) i`;
console.log(`\nImágenes cargadas ahora: ${imgCount} · ya existían: ${skipped}`);
console.log(`En la base de datos: ${t.c} categorías, ${t.p} productos, ${t.i} imágenes`);
