import { sql } from './db';

export interface RateResult {
  ok: boolean;
  /** Segundos hasta que se renueva la ventana (útil para la cabecera Retry-After). */
  retryAfter: number;
}

/**
 * Cuenta una petición para `key` dentro de una ventana deslizante y dice si sigue por debajo del límite.
 * El contador vive en Neon, así que se comparte entre todas las instancias de la función.
 */
export async function hit(key: string, limit: number, windowSeconds: number): Promise<RateResult> {
  const [row] = await sql`
    insert into rate_limits (key, window_start, count) values (${key}, now(), 1)
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then now() else rate_limits.window_start end
    returning count, greatest(0, ceil(extract(epoch from (window_start + make_interval(secs => ${windowSeconds}) - now()))))::int as retry_after`;
  return { ok: row.count <= limit, retryAfter: row.retry_after };
}
