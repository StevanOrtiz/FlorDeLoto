/**
 * Cabeceras de seguridad de todas las respuestas generadas en el servidor.
 *
 * Netlify (y Vercel con funciones) no aplican las cabeceras de `netlify.toml` / `vercel.json` a las páginas que
 * genera una función, solo a los archivos estáticos. Por eso el middleware las añade también aquí.
 * MANTENER IGUAL que `[[headers]]` en netlify.toml y `headers` en vercel.json.
 *
 * La CSP permite un único script en línea (las clases js/js-anim de Base.astro) mediante su hash sha256.
 * Si se cambia ese script, hay que recalcular el hash en los tres sitios.
 */
export const CSP =
  "default-src 'self'; script-src 'self' 'sha256-aVQv6qs+SUAnPBNkAgYn5NLuxBArKoWEbL2nL/q6qLo=' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; frame-src https://www.google.com https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; form-action 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests";

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': "max-age=63072000; includeSubDomains; preload",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': "strict-origin-when-cross-origin",
  'Permissions-Policy': "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

/** Añade las cabeceras que la respuesta no traiga ya. Devuelve la misma respuesta (o una copia si sus cabeceras son inmutables). */
export function withSecurityHeaders(response: Response): Response {
  const apply = (res: Response) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!res.headers.has(name)) res.headers.set(name, value);
    return res;
  };
  try {
    return apply(response);
  } catch {
    return apply(new Response(response.body, response));
  }
}
