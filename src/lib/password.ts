// Hash de contraseñas con scrypt (node:crypto): sin dependencias externas.
// Formato guardado: scrypt$N$r$p$salt(base64)$hash(base64). Los parámetros viajan con el hash para poder subirlos en el futuro.
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const N = 32768; // coste de CPU/memoria (2^15, recomendación OWASP para scrypt)
const R = 8;
const P = 1;
const KEYLEN = 64;

export const MIN_PASSWORD_LENGTH = 12;

function derive(password: string, salt: Buffer, n: number, r: number, p: number, keylen: number): Promise<Buffer> {
  const opts: ScryptOptions = { N: n, r, p, maxmem: 128 * n * r * 2 };
  return new Promise((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P, KEYLEN);
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, salt, hash] = stored.split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

let dummy: Promise<string> | undefined;
/** Hash falso para gastar el mismo tiempo cuando el correo no existe (evita distinguir cuentas por el tiempo de respuesta). */
export const dummyHash = () => (dummy ??= hashPassword(randomBytes(12).toString('hex')));

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (password.length > 200) return 'La contraseña es demasiado larga.';
  if (/^(.)\1+$/.test(password)) return 'La contraseña no puede repetir un solo carácter.';
  return null;
}
