import business from '../data/business.json';

export const SITE_URL = 'https://flordlotosegovia.com';
export { business };

/** Enlace de WhatsApp con mensaje prellenado. */
export function waLink(text?: string) {
  const base = `https://wa.me/${business.whatsappNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const fullAddress = `${business.address.street}, ${business.address.postalCode} ${business.address.city}`;

export const nav = [
  { label: 'Inicio', href: '/' },
  {
    label: 'Catálogo',
    href: '/catalogo',
    children: [
      { label: 'Ramos de flores', href: '/ramos-flores-segovia' },
      { label: 'Rosas y packs', href: '/rosas-segovia' },
      { label: 'Orquídeas', href: '/orquideas-segovia' },
      { label: 'Plantas y cestas', href: '/mas-flores-segovia' },
    ],
  },
  { label: 'Bodas y eventos', href: '/bodas-eventos-segovia' },
  { label: 'Funerales', href: '/funerales-segovia' },
  { label: 'Cuidados', href: '/cuidado-de-plantas' },
  { label: 'Contacto', href: '/contacto' },
];
