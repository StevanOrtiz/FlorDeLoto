// Validación y limpieza de los datos de un producto que llegan desde el panel de administrador.
// El servidor vuelve a validar todo: la validación del navegador es solo comodidad.

export interface ProductInput {
  name: string;
  slug: string;
  category_id: string;
  subcategory: string | null;
  description: string;
  composition: string[];
  dimensions: string | null;
  care: string[];
  watering: string | null;
  occasions: string[];
  price: number | null;
  published: boolean;
  featured: boolean;
}

/** Quita caracteres de control y espacios sobrantes (no toca el resto: al mostrarse todo se escapa). */
const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r/g, '').trim().slice(0, max) : '';

export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

/** Acepta una lista o un texto con un elemento por línea. */
function toList(value: unknown, maxItems: number, maxLen: number): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split('\n') : [];
  return raw
    .map((v) => clean(v, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

const toBool = (v: unknown) => v === true || v === 'true' || v === 'on';

export function parseProduct(raw: Record<string, unknown>): { data: ProductInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const name = clean(raw.name, 120);
  if (name.length < 2) errors.name = 'Escribe el nombre (mínimo 2 caracteres).';

  const slug = slugify(clean(raw.slug, 120) || name);
  if (!slug) errors.slug = 'La dirección (slug) no es válida.';

  const category_id = clean(raw.category_id, 20);
  if (!/^[a-z]+$/.test(category_id)) errors.category_id = 'Elige una categoría.';

  const description = clean(raw.description, 2000);

  let price: number | null = null;
  const priceText = typeof raw.price === 'number' ? String(raw.price) : clean(raw.price, 12).replace(',', '.');
  if (priceText !== '') {
    const n = Number(priceText);
    if (!Number.isFinite(n) || n < 0 || n >= 100000) errors.price = 'El precio debe ser un número entre 0 y 99999,99.';
    else price = Math.round(n * 100) / 100;
  }

  return {
    errors,
    data: {
      name,
      slug,
      category_id,
      subcategory: clean(raw.subcategory, 40) || null,
      description,
      composition: toList(raw.composition, 30, 120),
      dimensions: clean(raw.dimensions, 120) || null,
      care: toList(raw.care, 15, 300),
      watering: clean(raw.watering, 120) || null,
      occasions: toList(raw.occasions, 10, 40),
      price,
      published: toBool(raw.published),
      featured: toBool(raw.featured),
    },
  };
}
