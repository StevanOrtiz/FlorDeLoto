import { sql } from './db';

export interface Category {
  id: string;
  name: string;
  short: string;
  path: string;
  title: string;
  description: string;
  intro: string;
  sortOrder: number;
}

export interface ProductImage {
  id: string;
  alt: string;
  /** Foto completa (hasta 1400 px). */
  src: string;
  /** Miniatura (640 px) para listados. */
  thumb: string;
}

export interface Product {
  id: string;
  slug: string;
  category: string;
  categoryPath: string;
  categoryName: string;
  subcategory: string | null;
  name: string;
  description: string;
  composition: string[];
  dimensions: string | null;
  care: string[];
  watering: string | null;
  occasions: string[];
  price: number | null;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  updatedAt: string;
  images: ProductImage[];
}

export const mediaUrl = (id: string, size: 'full' | 'thumb' = 'full') => `/media/${id}${size === 'thumb' ? '?s=thumb' : ''}`;

type Row = Record<string, any>;

const toCategory = (r: Row): Category => ({
  id: r.id, name: r.name, short: r.short, path: r.path, title: r.title,
  description: r.description, intro: r.intro, sortOrder: r.sort_order,
});

const toProduct = (r: Row): Product => ({
  id: r.id,
  slug: r.slug,
  category: r.category_id,
  categoryPath: r.category_path,
  categoryName: r.category_name,
  subcategory: r.subcategory,
  name: r.name,
  description: r.description,
  composition: r.composition ?? [],
  dimensions: r.dimensions,
  care: r.care ?? [],
  watering: r.watering,
  occasions: r.occasions ?? [],
  price: r.price == null ? null : Number(r.price),
  published: r.published,
  featured: r.featured,
  sortOrder: r.sort_order,
  updatedAt: new Date(r.updated_at).toISOString(),
  images: ((r.images ?? []) as { id: string; alt: string | null }[]).map((i) => ({
    id: i.id,
    alt: i.alt ?? r.name,
    src: mediaUrl(i.id),
    thumb: mediaUrl(i.id, 'thumb'),
  })),
});

const PRODUCT_SELECT = `
  select p.*, c.path as category_path, c.name as category_name,
         coalesce(json_agg(json_build_object('id', i.id, 'alt', i.alt) order by i.position, i.created_at)
                  filter (where i.id is not null), '[]'::json) as images
  from products p
  join categories c on c.id = p.category_id
  left join product_images i on i.product_id = p.id`;

export async function getCategories(): Promise<Category[]> {
  const rows = await sql`select * from categories order by sort_order`;
  return rows.map(toCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const [r] = await sql`select * from categories where id = ${id}`;
  return r ? toCategory(r) : null;
}

export async function getCategoryByPath(path: string): Promise<Category | null> {
  const [r] = await sql`select * from categories where path = ${path}`;
  return r ? toCategory(r) : null;
}

interface ProductQuery {
  category?: string;
  featured?: boolean;
  /** Incluye los ocultos (solo para el panel de administración). */
  all?: boolean;
  search?: string;
  limit?: number;
}

/** Lista de productos publicados (o todos, para el admin), ordenados como el catálogo. */
export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (!q.all) where.push('p.published');
  if (q.category) { params.push(q.category); where.push(`p.category_id = $${params.length}`); }
  if (q.featured) where.push('p.featured');
  if (q.search) { params.push(`%${q.search.replace(/[\\%_]/g, '\\$&')}%`); where.push(`(p.name ilike $${params.length} or p.slug ilike $${params.length})`); }
  let text = `${PRODUCT_SELECT} ${where.length ? 'where ' + where.join(' and ') : ''}
              group by p.id, c.path, c.name, c.sort_order
              order by c.sort_order, p.sort_order, p.name`;
  if (q.limit) { params.push(q.limit); text += ` limit $${params.length}`; }
  const rows = (await sql.query(text, params)) as Row[];
  return rows.map(toProduct);
}

export async function getProductBySlug(categoryId: string, slug: string, opts: { all?: boolean } = {}): Promise<Product | null> {
  const rows = (await sql.query(
    `${PRODUCT_SELECT} where p.slug = $1 and p.category_id = $2 ${opts.all ? '' : 'and p.published'}
     group by p.id, c.path, c.name`,
    [slug, categoryId],
  )) as Row[];
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const rows = (await sql.query(`${PRODUCT_SELECT} where p.id = $1 group by p.id, c.path, c.name`, [id])) as Row[];
  return rows[0] ? toProduct(rows[0]) : null;
}

export const productUrl = (p: Pick<Product, 'categoryPath' | 'slug'>) => `${p.categoryPath}/${p.slug}`;

export function formatPrice(p: Pick<Product, 'price'>) {
  return p.price == null
    ? 'Consultar precio'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.price);
}

/** Primera foto del producto, o null si no tiene. */
export const cover = (p: Product | undefined) => p?.images[0] ?? null;
