// Crea (o restablece) la única cuenta de administrador.
//
// Uso (la contraseña se pasa solo para esta ejecución; no la guardes en ningún archivo):
//   ADMIN_EMAIL=correo@ejemplo.com ADMIN_PASSWORD='una contraseña larga' npm run admin:create
//   ... npm run admin:create -- --reset     (cambia el correo y la contraseña de la cuenta existente y cierra sus sesiones)
import { neon } from '@neondatabase/serverless';
import { hashPassword, passwordProblem } from '../src/lib/password.ts';

const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? '';
const reset = process.argv.includes('--reset');

const fail = (message) => { console.error('✗ ' + message); process.exit(1); };

if (!process.env.DATABASE_URL) fail('Falta DATABASE_URL (archivo .env).');
if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) || email.length > 200) fail('ADMIN_EMAIL no es un correo válido.');
const problem = passwordProblem(password);
if (problem) fail(problem);

const sql = neon(process.env.DATABASE_URL);
const [existing] = await sql`select email from admin_users`;
if (existing && !reset) fail(`Ya existe una cuenta de administrador (${existing.email}). Usa --reset para cambiarla.`);

const hash = await hashPassword(password);
await sql`
  insert into admin_users (id, email, password_hash) values (true, ${email}, ${hash})
  on conflict (id) do update set email = excluded.email, password_hash = excluded.password_hash, updated_at = now()`;
await sql`delete from admin_sessions`; // cierra cualquier sesión abierta
console.log(`✓ Cuenta de administrador ${existing ? 'restablecida' : 'creada'}: ${email}`);
