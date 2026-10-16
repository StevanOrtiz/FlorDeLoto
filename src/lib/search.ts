import { sql } from './db';
import type { Product } from './catalog';

/**
 * Buscador del catálogo. Busca en nombre, palabras clave, tipo/categoría/ocasiones, composición y descripción,
 * sin distinguir tildes ni mayúsculas, con plurales, sinónimos básicos y tolerancia a erratas (pg_trgm).
 * Todo va en consultas parametrizadas: lo que escribe el usuario nunca se concatena en el SQL.
 */

/** Minúsculas y sin tildes (ñ → n, igual que `unaccent` en la base de datos). */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const STOPWORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas', 'para', 'con', 'sin', 'por', 'en', 'y', 'o', 'a', 'al', 'que', 'mi', 'su']);

/** Grupos de sinónimos (ya sin tildes). Si una palabra coincide con cualquiera, se busca también con las demás. */
const SYNONYMS: string[][] = [
  ['cumple', 'cumpleanos', 'felicitacion'],
  ['novia', 'boda', 'nupcial', 'matrimonio', 'enlace'],
  ['amor', 'romantic', 'enamorad', 'valentin', 'pasion', 'pareja', 'te amo'],
  ['funeral', 'funerari', 'difunto', 'pesame', 'luto', 'condolencia', 'tanatorio', 'duelo', 'entierro'],
  ['corona', 'laurel'],
  ['orquidea', 'phalaenopsis'],
  ['regalo', 'detalle', 'obsequio', 'pack'],
  ['cesta', 'cesto', 'canasta'],
  ['ramo', 'bouquet'],
  ['mama', 'madre'],
  ['perfum', 'aroma', 'fragan', 'olor'],
  ['preservad', 'eterna', 'eterno', 'inmortal', 'duradera'],
  ['bonsai', 'arbol'],
  ['terrari', 'terrarium'],
  ['blanc', 'white'],
  ['roj', 'red'],
  ['amarill', 'dorad'],
  ['nacimiento', 'bebe', 'recien nacido'],
  ['agradecimiento', 'gracias', 'gratitud'],
];

/** Quita plurales sencillos para que «rosas» encuentre «rosa» y «claveles» encuentre «clavel». */
function stem(t: string) {
  if (t.length > 4 && t.endsWith('es')) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1);
  return t;
}

export interface SearchTerm {
  /** Lo que escribió el usuario (normalizado y sin plural). */
  base: string;
  /** Alternativas: la propia palabra más sus sinónimos. */
  alts: string[];
}

/** Divide la consulta en palabras útiles (máx. 6) y añade sinónimos. */
export function parseQuery(q: string): SearchTerm[] {
  const words = normalize(q)
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 2 && w.length <= 30 && !STOPWORDS.has(w))
    .slice(0, 6);
  const seen = new Set<string>();
  const terms: SearchTerm[] = [];
  for (const w of words) {
    const base = stem(w);
    if (seen.has(base)) continue;
    seen.add(base);
    const alts = new Set<string>([base]);
    for (const group of SYNONYMS) {
      if (group.some((g) => base.startsWith(g) || (base.length >= 4 && g.startsWith(base)))) group.forEach((g) => alts.add(g));
    }
    terms.push({ base, alts: [...alts].slice(0, 10) });
  }
  return terms;
}

export interface SearchOptions {
  /** Id de categoría para filtrar (rosas, ramos, plantas, funerales). */
  category?: string;
  limit?: number;
}

export interface SearchHit extends Product {
  score: number;
}

type Row = Record<string, any>;

/**
 * Pesos por campo: el nombre pesa más que las palabras clave, y estas más que la descripción.
 * Tolerancia a erratas solo para la palabra escrita (no para sinónimos) y a partir de 4 letras.
 */
export function buildSearchQuery(terms: SearchTerm[], opts: SearchOptions = {}) {
  const params: unknown[] = [];
  const add = (v: unknown) => (params.push(v), `$${params.length}`);

  const groupCols: string[] = [];
  terms.forEach((t, i) => {
    const alts = t.alts.map((a) => {
      const like = add(`%${a}%`);
      let expr = `(case when f.nm like ${like} then 10 else 0 end + case when f.kw like ${like} then 7 else 0 end
        + case when f.tg like ${like} then 5 else 0 end + case when f.cp like ${like} then 4 else 0 end + case when f.ds like ${like} then 2 else 0 end)`;
      if (a === t.base && a.length >= 4) {
        const w = add(a);
        // Más letras → umbral más bajo (una errata pesa menos en una palabra larga).
        const min = a.length >= 6 ? 0.42 : a.length === 5 ? 0.5 : 0.6;
        expr = `greatest(${expr}, case when word_similarity(${w}, f.nm) >= ${min} then 6 else 0 end,
          case when word_similarity(${w}, f.kw) >= ${min} then 4 else 0 end, case when word_similarity(${w}, f.tg) >= ${min} then 3 else 0 end)`;
      }
      return expr;
    });
    groupCols.push(`greatest(${alts.join(', ')}) as g${i}`);
  });

  const scoreSum = terms.map((_, i) => `s.g${i}`).join(' + ');
  const allMatch = terms.map((_, i) => `s.g${i} > 0`).join(' and ');
  const where = ['p.published', allMatch];
  if (opts.category) where.push(`p.category_id = ${add(opts.category)}`);
  const limit = add(Math.min(Math.max(opts.limit ?? 48, 1), 100));

  const text = `
    select p.*, c.path as category_path, c.name as category_name, (${scoreSum}) as score,
           coalesce((select json_agg(json_build_object('id', i.id, 'alt', i.alt) order by i.position, i.created_at)
                     from product_images i where i.product_id = p.id), '[]'::json) as images
      from products p
      join categories c on c.id = p.category_id
     cross join lateral (select
        f_unaccent(lower(p.name)) as nm,
        f_unaccent(lower(array_to_string(p.keywords, ' '))) as kw,
        f_unaccent(lower(coalesce(p.subcategory, '') || ' ' || c.short || ' ' || array_to_string(p.occasions, ' '))) as tg,
        f_unaccent(lower(array_to_string(p.composition, ' '))) as cp,
        f_unaccent(lower(p.description)) as ds) f
     cross join lateral (select ${groupCols.join(', ')}) s
     where ${where.join(' and ')}
     order by score desc, c.sort_order, p.sort_order, p.name
     limit ${limit}`;
  return { text, params };
}

/** Busca productos publicados. Devuelve la lista ordenada por relevancia (vacía si no hay palabras útiles). */
export async function searchProducts(q: string, opts: SearchOptions = {}): Promise<{ terms: SearchTerm[]; rows: Row[] }> {
  const terms = parseQuery(q);
  if (!terms.length) return { terms, rows: [] };
  const { text, params } = buildSearchQuery(terms, opts);
  const rows = (await sql.query(text, params)) as Row[];
  return { terms, rows };
}

/** Convierte las filas de `searchProducts` en productos listos para pintar. */
export { toProduct } from './catalog';
