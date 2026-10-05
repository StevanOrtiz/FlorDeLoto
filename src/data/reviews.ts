// Reseñas de Google seleccionadas en el documento de contenido (5 estrellas).
// `quote` solo contiene frases textuales que aparecen entrecomilladas en la fuente;
// `summary` es un resumen, y se muestra como tal (sin comillas).
// Se usa solo el nombre de pila hasta tener el permiso de cada cliente.

export interface Review {
  author: string;
  date: string;
  rating: number;
  summary: string;
  quote?: string;
}

export const reviews: Review[] = [
  { author: 'Kiara', date: 'sep 2026', rating: 5, quote: 'Tiene un gusto exquisito', summary: 'Fue sin una idea concreta y salió con el ramo perfecto.' },
  { author: 'Aurora', date: 'sep 2026', rating: 5, summary: 'Ramo de rosas con un olor espectacular y un envío perfecto.' },
  { author: 'Leticia', date: 'jul 2026', rating: 5, summary: 'Cumplieron el encargo y la hora de entrega. Ya es su segundo pedido.' },
  { author: 'María José', date: 'jun 2026', rating: 5, quote: 'Quedó espectacular', summary: 'Decoraron la iglesia para la comunión de su hija.' },
  { author: 'Ignacio', date: 'mar 2026', rating: 5, summary: 'Un ramo precioso que duró muchísimo.' },
  { author: 'María', date: 'feb 2026', rating: 5, summary: 'Pedido de última hora para enviar flores a un hospital.' },
  { author: 'Sergio', date: 'ene 2026', rating: 5, quote: 'Trato, perfecto. Ramo, perfecto. Precio, perfecto.', summary: '' },
  { author: 'Guillermo', date: 'ene 2026', rating: 5, summary: 'Flores de alta calidad y envíos a domicilio rápidos.' },
  { author: 'Gabriela', date: 'nov 2025', rating: 5, summary: 'Pidió desde Brasil un envío a domicilio para alguien en Segovia.' },
  { author: 'Alejandra', date: 'nov 2025', rating: 5, summary: 'Flor muy bien envuelta para regalar, a buen precio.' },
];
