import type { APIRoute } from 'astro';
import { toProduct, productUrl, formatPrice, cover } from '../../lib/catalog';
import { searchProducts } from '../../lib/search';
import { PUBLIC_CACHE } from '../../lib/cache';

export const prerender = false;

/** Sugerencias del buscador (máx. 6). Pública, de solo lectura y cacheable: la misma consulta no vuelve a la base de datos durante un minuto. */
export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get('q') ?? '').slice(0, 80);
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': PUBLIC_CACHE };
  try {
    const { rows } = await searchProducts(q, { limit: 6 });
    const results = rows.map((r) => {
      const p = toProduct(r);
      return {
        name: p.name,
        url: productUrl(p),
        category: p.subcategory ?? p.categoryName,
        price: formatPrice(p),
        thumb: cover(p)?.thumb ?? null,
        alt: cover(p)?.alt ?? p.name,
      };
    });
    return new Response(JSON.stringify({ q, results }), { headers });
  } catch (e) {
    console.error('[search] error', e);
    return new Response(JSON.stringify({ q, results: [], error: true }), { status: 503, headers: { ...headers, 'Cache-Control': 'no-store' } });
  }
};
