import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { getSecret } from 'astro:env/server';

// Sin modo array ni resultados completos: cada consulta devuelve directamente la lista de filas.
type Sql = NeonQueryFunction<false, false>;

let client: Sql | undefined;

/**
 * El cliente se crea en la primera consulta y no al importar el módulo: así la compilación (y las páginas que se
 * generan en ese momento, como el aviso legal) no necesita DATABASE_URL ni toca la base de datos.
 */
function connect(): Sql {
  if (!client) {
    const url = getSecret('DATABASE_URL');
    if (!url) throw new Error('Falta la variable de entorno DATABASE_URL.');
    client = neon(url);
  }
  return client;
}

/**
 * Cliente de Neon por HTTP: sin conexiones abiertas, ideal para funciones sin estado.
 * Todas las consultas van parametrizadas (plantillas `sql\`…\`` o `sql.query(texto, [params])`);
 * nunca se concatena texto del usuario dentro de una sentencia.
 */
export const sql = new Proxy(function () {}, {
  apply: (_target, _this, args) => (connect() as unknown as (...a: unknown[]) => unknown)(...args),
  get: (_target, prop) => {
    const db = connect() as unknown as Record<string | symbol, unknown>;
    const value = db[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  },
}) as unknown as Sql;

/** Id válido (uuid) para usarlo en rutas y consultas. */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
