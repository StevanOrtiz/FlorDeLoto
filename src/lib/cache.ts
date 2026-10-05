/** Páginas públicas del catálogo: la CDN las guarda 1 minuto y sirve la copia anterior mientras renueva. */
export const PUBLIC_CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=600';

export function cachePublic(response: { headers: Headers }) {
  response.headers.set('Cache-Control', PUBLIC_CACHE);
}
