import business from '../data/business.json';

export const SITE_URL = 'https://flordlotosegovia.com';
export { business };

/** Enlace de WhatsApp con mensaje prellenado. */
export function waLink(text?: string) {
  const base = `https://wa.me/${business.whatsappNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const fullAddress = `${business.address.street}, ${business.address.postalCode} ${business.address.city}`;

/** Menú principal, de izquierda a derecha. El logo lleva a Inicio y «Contacto» es un botón aparte. */
export const nav = [
  { label: 'Rosas', href: '/rosas-segovia' },
  { label: 'Ramos', href: '/ramos-flores-segovia' },
  { label: 'Plantas', href: '/plantas-segovia' },
  { label: 'Funerario', href: '/funerales-segovia' },
  { label: 'Bodas & eventos', href: '/bodas-eventos-segovia' },
];

/** Enlaces de las categorías para el pie de página (fijos, sin consultar la base de datos). */
export const footerCategories = [
  { label: 'Rosas', href: '/rosas-segovia' },
  { label: 'Ramos', href: '/ramos-flores-segovia' },
  { label: 'Plantas y orquídeas', href: '/plantas-segovia' },
  { label: 'Funerario', href: '/funerales-segovia' },
  { label: 'Bodas & eventos', href: '/bodas-eventos-segovia' },
];
