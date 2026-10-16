// Prepara la base de datos para el buscador: extensiones unaccent y pg_trgm, función f_unaccent y columna keywords.
// Idempotente. Uso: npm run db:migrate-search   (necesita DATABASE_URL)
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL. Ejecuta con: npm run db:migrate-search');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

await sql`create extension if not exists unaccent`;
await sql`create extension if not exists pg_trgm`;
await sql`
  create or replace function f_unaccent(text) returns text
    language sql immutable parallel safe strict
    as $$ select public.unaccent('public.unaccent'::regdictionary, $1) $$`;
await sql`alter table products add column if not exists keywords text[] not null default '{}'`;

const [t] = await sql`select f_unaccent('Orquídea ñandú') as probe, (select count(*) from products)::int as products`;
console.log(`Listo. f_unaccent → «${t.probe}» · ${t.products} productos.`);
