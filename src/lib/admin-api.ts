export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

/** Lee el cuerpo JSON con un tamaño máximo; devuelve null si no es un objeto válido. */
export async function readJson(request: Request, maxBytes = 50_000): Promise<Record<string, unknown> | null> {
  if (!request.headers.get('content-type')?.includes('application/json')) return null;
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes) return null;
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** ¿Es un error de clave duplicada de Postgres? */
export const isUniqueViolation = (e: unknown) => typeof e === 'object' && e !== null && (e as { code?: string }).code === '23505';
