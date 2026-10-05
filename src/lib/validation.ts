// Validación compartida entre el navegador y el servidor.
// El servidor vuelve a validar todo: la validación del navegador es solo comodidad.

export type FormKind = 'contacto' | 'evento';

export interface ContactInput {
  kind: FormKind;
  nombre: string;
  email: string;
  telefono: string;
  asunto: string;
  tipoEvento: string;
  fecha: string;
  lugar: string;
  mensaje: string;
  consentimiento: boolean;
}

export const EVENT_TYPES = ['Boda', 'Comunión', 'Bautizo', 'Evento de empresa', 'Funeral', 'Otro'] as const;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const PHONE_RE = /^[+()\d\s.-]{6,20}$/;

/** Quita caracteres de control y etiquetas, y recorta. */
export function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, max);
}

export function normalize(raw: Record<string, unknown>): ContactInput {
  return {
    kind: raw.kind === 'evento' ? 'evento' : 'contacto',
    nombre: clean(raw.nombre, 100),
    email: clean(raw.email, 160).toLowerCase(),
    telefono: clean(raw.telefono, 20),
    asunto: clean(raw.asunto, 140),
    tipoEvento: clean(raw.tipoEvento, 40),
    fecha: clean(raw.fecha, 10),
    lugar: clean(raw.lugar, 140),
    mensaje: clean(raw.mensaje, 3000),
    consentimiento: raw.consentimiento === true || raw.consentimiento === 'on' || raw.consentimiento === 'true',
  };
}

export function validate(d: ContactInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (d.nombre.length < 2) e.nombre = 'Escribe tu nombre.';
  if (!EMAIL_RE.test(d.email)) e.email = 'Escribe un correo electrónico válido.';
  if (d.telefono && !PHONE_RE.test(d.telefono)) e.telefono = 'Revisa el número de teléfono.';
  if (d.kind === 'contacto' && d.asunto.length < 3) e.asunto = 'Indica el asunto.';
  if (d.kind === 'evento') {
    if (!(EVENT_TYPES as readonly string[]).includes(d.tipoEvento)) e.tipoEvento = 'Elige el tipo de evento.';
    if (d.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(d.fecha)) e.fecha = 'Revisa la fecha.';
  }
  if (d.mensaje.length < 10) e.mensaje = 'Cuéntanos un poco más (mínimo 10 caracteres).';
  if (!d.consentimiento) e.consentimiento = 'Necesitamos tu consentimiento para responderte.';
  return e;
}
