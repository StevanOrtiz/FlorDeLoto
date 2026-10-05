import type { APIRoute } from 'astro';

// Las fichas de orquídeas y «más flores» ahora están en Plantas: 301 permanente para conservar el posicionamiento.
// Se hace con una ruta propia (no con `redirects` de astro.config) porque cada adaptador traduce mal los redirects con parámetros.
export const GET: APIRoute = ({ params, redirect }) => redirect(`/plantas-segovia/${encodeURIComponent(params.slug ?? '')}`, 301);
