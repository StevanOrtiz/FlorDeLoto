import type { APIRoute } from 'astro';
import { sql } from '../lib/db';
import { SITE_URL } from '../lib/site';

export const prerender = false;

const STATIC = ['/', '/catalogo', '/bodas-eventos-segovia', '/cuidado-de-plantas', '/contacto', '/aviso-legal', '/politica-de-privacidad', '/politica-de-cookies'];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async () => {
  const [cats, prods] = await Promise.all([
    sql`select path from categories order by sort_order`,
    sql`select c.path || '/' || p.slug as path, p.updated_at from products p join categories c on c.id = p.category_id
        where p.published and c.id <> 'funerales' order by c.sort_order, p.sort_order`,
  ]);
  const urls = [
    ...STATIC.map((p) => ({ loc: p })),
    ...cats.map((c) => ({ loc: c.path as string })),
    ...prods.map((p) => ({ loc: p.path as string, lastmod: new Date(p.updated_at).toISOString().slice(0, 10) })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(SITE_URL + (u.loc === '/' ? '' : u.loc))}</loc>${'lastmod' in u ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
};
