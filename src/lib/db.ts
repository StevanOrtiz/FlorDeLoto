import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from 'astro:env/server';

/**
 * Cliente de Neon por HTTP: sin conexiones abiertas, ideal para funciones sin estado.
 * Todas las consultas van parametrizadas (plantillas `sql\`…\`` o `sql.query(texto, [params])`);
 * nunca se concatena texto del usuario dentro de una sentencia.
 */
export const sql = neon(DATABASE_URL);

/** Id válido (uuid) para usarlo en rutas y consultas. */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
