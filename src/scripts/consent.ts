export interface Consent {
  v: 1;
  external: boolean;
  date: string;
}

const KEY = 'fdl-consent';

export function getConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consent;
    return c.v === 1 ? c : null;
  } catch {
    return null;
  }
}

export function setConsent({ external }: { external: boolean }) {
  const c: Consent = { v: 1, external, date: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* almacenamiento bloqueado: la elección vale solo para esta visita */
  }
  window.dispatchEvent(new CustomEvent<Consent>('consent:change', { detail: c }));
}
