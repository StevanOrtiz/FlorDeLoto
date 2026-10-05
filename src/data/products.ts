// Catálogo derivado de flor-de-loto-catalogo.json (web actual, extraído el 05/10/2026).
// Textos corregidos y reescritos solo con la información disponible: no se inventan datos.
// Precios: `price` queda en null hasta tener la lista oficial del cliente (se muestra "Consultar").
// Imágenes: se enlazan las de la web actual hasta recibir los originales en alta resolución.

export type CategoryId = 'ramos' | 'rosas' | 'orquideas' | 'plantas' | 'funerales';

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  path: string;
  title: string;
  description: string;
  intro: string;
}

export interface Product {
  slug: string;
  name: string;
  category: CategoryId;
  description: string;
  composition?: string[];
  dimensions?: string;
  care?: string[];
  watering?: string;
  occasions?: string[];
  images: string[];
  price: number | null;
}

const IMG = 'https://flordlotosegovia.com/assets/img/products';

export const categories: Category[] = [
  {
    id: 'ramos',
    name: 'Ramos de flores',
    short: 'Ramos',
    path: '/ramos-flores-segovia',
    title: 'Ramos de flores en Segovia a domicilio',
    description:
      'Ramos de flores frescas hechos a mano en Segovia: rosas, girasoles, lirios, margaritas y gerberas. Entrega a domicilio en Segovia y alrededores.',
    intro:
      'Cada ramo se monta a mano con flor fresca, pensando en la persona que lo va a recibir. Elige uno de nuestros diseños o cuéntanos qué buscas y lo preparamos para ti.',
  },
  {
    id: 'rosas',
    name: 'Rosas y packs regalo',
    short: 'Rosas',
    path: '/rosas-segovia',
    title: 'Rosas y packs regalo en Segovia',
    description:
      'Rosas rojas, multicolor y preservadas, y packs regalo con bombones, vino y peluche. Floristería en Segovia con entrega a domicilio.',
    intro:
      'Rosas para decir lo que a veces cuesta decir: una sola en jarrón, una cúpula de rosas preservadas o un pack regalo completo para sorprender.',
  },
  {
    id: 'orquideas',
    name: 'Orquídeas',
    short: 'Orquídeas',
    path: '/orquideas-segovia',
    title: 'Orquídeas Phalaenopsis en Segovia',
    description:
      'Orquídeas Phalaenopsis de interior con guía de cuidados: luz, riego y abono. Floristería en Segovia con entrega a domicilio.',
    intro:
      'Elegantes, duraderas y agradecidas. Te contamos cómo cuidarlas para que florezcan una y otra vez.',
  },
  {
    id: 'plantas',
    name: 'Plantas, cestas y terrarios',
    short: 'Plantas y más',
    path: '/mas-flores-segovia',
    title: 'Plantas de interior, cestas y terrarios en Segovia',
    description:
      'Plantas de interior, olivos, cestas de plantas para nacimientos, terrarios y arreglos de eucalipto. Floristería en Segovia.',
    intro:
      'Verde para casa, para la oficina o para regalar. Plantas de interior, cestas, terrarios y arreglos de eucalipto, con consejos de cuidado.',
  },
  {
    id: 'funerales',
    name: 'Flores para funerales',
    short: 'Funerales',
    path: '/funerales-segovia',
    title: 'Coronas y centros funerarios en Segovia',
    description:
      'Coronas de flores, centros y ramos funerarios en Segovia. Te acompañamos con respeto y cuidamos cada detalle. Llámanos o escríbenos por WhatsApp.',
    intro:
      'En los momentos más difíciles, las flores acompañan cuando faltan las palabras. Preparamos coronas, centros y ramos funerarios con respeto y cuidado.',
  },
];

export const products: Product[] = [
  // ——— Ramos de flores ———
  {
    slug: 'ramo-armonia',
    name: 'Ramo Armonía',
    category: 'ramos',
    description:
      'Una nube de paniculata blanca (gypsophila) recién cortada, enmarcada con helechos. Sencillo, delicado y luminoso.',
    composition: ['Paniculata blanca · 12 ud.', 'Helechos · 7 ud.'],
    dimensions: '40 × 45 cm',
    images: [`${IMG}/bouquet/ramo-armonia_1.jpg`, `${IMG}/bouquet/ramo-armonia_2.jpg`, `${IMG}/bouquet/ramo-armonia_3.jpg`],
    price: null,
  },
  {
    slug: 'ramo-girasoles-templanza',
    name: 'Ramo de girasoles Templanza',
    category: 'ramos',
    description:
      'Girasoles teddy, solidago amarillo, follaje rojo y eucalipto. Un ramo vibrante que transmite felicidad y vitalidad.',
    composition: ['Girasol teddy · 6 ud.', 'Solidago amarillo · 5 ud.', 'Eucalipto · 5 ud.', 'Follaje rojo decorativo · 6 ud.', 'Helechos · 4 ud.'],
    dimensions: '45 × 45 cm',
    occasions: ['Cumpleaños', 'Ánimo', 'Felicitaciones'],
    images: [`${IMG}/bouquet/ramo-girasoles_templanza_1.jpg`, `${IMG}/bouquet/ramo-girasoles_templanza_2.jpg`],
    price: null,
  },
  {
    slug: 'ramo-claveles-rojos',
    name: 'Ramo de claveles rojos',
    category: 'ramos',
    description:
      'Claveles colombianos rojos con gypsophila y helechos. Un diseño clásico y elegante para aniversarios, momentos románticos o para expresar admiración.',
    composition: ['Clavel colombiano · 12 ud.', 'Gypsophila · 6 ud.', 'Helechos · 7 ud.'],
    dimensions: '45 × 45 cm',
    occasions: ['Aniversario', 'Amor'],
    images: [`${IMG}/bouquet/ramo-claveles_rojos_1.jpg`, `${IMG}/bouquet/ramo-claveles_rojos_2.jpg`],
    price: null,
  },
  {
    slug: 'ramo-amantina',
    name: 'Ramo Amantina',
    category: 'ramos',
    description:
      'Rosas blancas con hojas de aspidistra, helechos y solidago verde. Clásico y refinado: paz, amor y respeto.',
    composition: ['Rosas blancas · 6 ud.', 'Helechos · 5 ud.', 'Hojas de aspidistra · 4 ud.', 'Solidago verde · 3 ud.'],
    dimensions: '40 × 50 cm',
    images: [`${IMG}/bouquet/ramo-amantina_1.jpg`, `${IMG}/bouquet/ramo-amantina_2.jpg`, `${IMG}/bouquet/ramo-amantina_3.jpg`],
    price: null,
  },
  {
    slug: 'ramo-primavera',
    name: 'Ramo Primavera',
    category: 'ramos',
    description:
      'Once lirios con paniculata blanca y verde tropical. Un ramo de gran tamaño y colorido espectacular.',
    composition: ['Lirios · 11 ud.', 'Verde tropical · 8 ud.', 'Paniculata blanca · 4 ud.'],
    dimensions: '55 × 55 cm',
    images: [`${IMG}/bouquet/ramo-primavera_1.jpg`, `${IMG}/bouquet/ramo-primavera_2.jpg`, `${IMG}/bouquet/ramo-primavera_3.jpg`],
    price: null,
  },
  {
    slug: 'ramo-rosas-eucalipto',
    name: 'Ramo de rosas y eucalipto',
    category: 'ramos',
    description:
      'Doce rosas en tonos pastel con eucalipto, paniculata y solidago. Ternura, amor y delicadeza en un solo ramo.',
    composition: ['Rosas · 12 ud.', 'Eucalipto · 8 ud.', 'Helechos y hojas decorativas · 5 ud.', 'Paniculata · 2 ud.', 'Solidago amarillo · 1 ud.'],
    dimensions: '55 × 60 cm',
    occasions: ['Amor', 'Agradecimiento'],
    images: [`${IMG}/bouquet/ramo-rosas_eucalipto.jpg`],
    price: null,
  },
  {
    slug: 'ramo-gerberas',
    name: 'Ramo de gerberas',
    category: 'ramos',
    description:
      'Diez gerberas con solidago, paniculata y follaje verde. Lleno de vida y color, para regalar alegría.',
    composition: ['Gerbera · 10 ud.', 'Helechos y follaje · 6 ud.', 'Solidago amarillo · 3 ud.', 'Paniculata · 2 ud.'],
    dimensions: '40 × 55 cm',
    occasions: ['Cumpleaños', 'Ánimo'],
    images: [`${IMG}/bouquet/ramo-gerber_1.jpg`, `${IMG}/bouquet/ramo-gerber_2.jpg`],
    price: null,
  },
  {
    slug: 'ramo-margaritas',
    name: 'Ramo de margaritas',
    category: 'ramos',
    description: 'Margaritas con eucalipto y solidago amarillo. Un ramo lleno de luz y frescura.',
    composition: ['Margaritas · 10 ud.', 'Eucalipto · 5 ud.', 'Solidago amarillo · 3 ud.'],
    dimensions: '45 × 55 cm',
    images: [`${IMG}/bouquet/ramo-margaritas_1.jpg`, `${IMG}/bouquet/ramo-margaritas_2.jpg`, `${IMG}/bouquet/ramo-margaritas_3.jpg`],
    price: null,
  },
  {
    slug: 'ramo-24-rosas-rojas',
    name: 'Ramo de 24 rosas rojas',
    category: 'ramos',
    description:
      'Veinticuatro rosas rojas con paniculata, solidago y follaje. Elegante y sofisticado: amor y pasión para aniversarios y declaraciones.',
    composition: ['Rosas rojas · 24 ud.', 'Helechos y follaje · 10 ud.', 'Paniculata · 4 ud.', 'Solidago amarillo · 3 ud.'],
    dimensions: '45 × 55 cm',
    occasions: ['Aniversario', 'San Valentín', 'Declaración'],
    images: [`${IMG}/bouquet/ramo_24_rosas_rojas_1.jpg`, `${IMG}/bouquet/ramo_24_rosas_rojas_2.jpg`, `${IMG}/bouquet/ramo_24_rosas_rojas_3.jpg`],
    price: null,
  },
  {
    slug: 'ramo-amsterdam',
    name: 'Ramo Amsterdam',
    category: 'ramos',
    description:
      'Gerberas fucsias, lirios orientales rosados, iris azules, crisantemos, clavel amarillo, astromelias y margaritas mini, envueltos en papel amarillo mostaza. Ideal para celebraciones alegres.',
    composition: ['Gerberas fucsias', 'Lirios orientales rosados', 'Iris azules', 'Crisantemos', 'Clavel amarillo', 'Astromelias', 'Margaritas mini', 'Verdes ornamentales'],
    dimensions: '30–40 × 40–45 cm',
    occasions: ['Celebraciones', 'Cumpleaños'],
    images: [`${IMG}/bouquet/ramo-amsterdam.jpg`],
    price: null,
  },
  {
    slug: 'ramo-colombia',
    name: 'Ramo Colombia',
    category: 'ramos',
    description:
      'Lirios blancos, gerberas y rosas amarillas, claveles rosados y púrpuras y una rosa azul teñida, con helechos y papel blanco. Un ramo alto, colorido y variado.',
    composition: ['Lirios blancos', 'Gerberas amarillas', 'Rosas amarillas', 'Claveles rosados y púrpuras', 'Rosa azul teñida', 'Helechos'],
    dimensions: '40–50 cm de ancho × 60–70 cm de alto',
    images: [`${IMG}/bouquet/ramo-colombia.jpg`],
    price: null,
  },
  {
    slug: 'ramo-malaga',
    name: 'Ramo Málaga',
    category: 'ramos',
    description:
      'Una rosa naranja en el centro rodeada de lirios amarillos, crisantemos, claveles y alstroemerias, con papel blanco y lazo verde.',
    composition: ['Rosa naranja', 'Lirios amarillos', 'Crisantemos', 'Claveles', 'Alstroemerias', 'Verdes'],
    dimensions: '40–45 cm de ancho × 50–60 cm de alto',
    images: [`${IMG}/bouquet/ramo-malaga.jpg`],
    price: null,
  },

  // ——— Rosas y packs ———
  {
    slug: 'rosas-multicolor',
    name: 'Rosas multicolor',
    category: 'rosas',
    description: 'Diez rosas de colores con eucalipto, paniculata y solidago. Una explosión de color para cualquier ocasión.',
    composition: ['Rosas multicolor · 10 ud.', 'Helechos y follaje · 6 ud.', 'Eucalipto · 5 ud.', 'Paniculata · 3 ud.', 'Solidago amarillo · 3 ud.'],
    dimensions: '60 × 60 cm',
    images: [`${IMG}/floors/rouses/rosas-multicolor_1.jpg`, `${IMG}/floors/rouses/rosas-multicolor_2.jpg`],
    price: null,
  },
  {
    slug: 'rosa-unica-jarron',
    name: 'Rosa única con jarrón',
    category: 'rosas',
    description: 'Una rosa roja con eucalipto y paniculata en jarrón de vidrio. Un gesto elegante para expresar amor, admiración o gratitud.',
    composition: ['Rosa roja · 1 ud.', 'Eucalipto · 4 ud.', 'Paniculata · 2 ud.', 'Jarrón de vidrio · 1 ud.'],
    dimensions: '12 × 40 cm',
    occasions: ['Amor', 'Agradecimiento'],
    images: [`${IMG}/floors/rouses/rosas-unica%20_jarron.jpg`],
    price: null,
  },
  {
    slug: 'cupula-3-rosas-preservadas',
    name: 'Cúpula de 3 rosas preservadas',
    category: 'rosas',
    description: 'Rosas eternas bajo cúpula de cristal. Duran mucho tiempo sin agua ni cuidados.',
    composition: ['Cúpula de cristal con rosas preservadas · 1 ud.'],
    dimensions: '21 × 34 cm',
    occasions: ['Aniversario', 'Recuerdo'],
    images: [`${IMG}/floors/rouses/rosas-3_rosas_preservadas.jpg`],
    price: null,
  },
  {
    slug: 'rosas-damita',
    name: 'Rosas Damita',
    category: 'rosas',
    description: 'Caja LOVE con rosas azules teñidas, bombones Ferrero Rocher, oso de peluche, botella de vino Merlot, globo y tarjeta. Un regalo romántico completo.',
    composition: ['Rosas azules teñidas', 'Bombones Ferrero Rocher', 'Oso de peluche', 'Vino Merlot', 'Globo', 'Tarjeta'],
    dimensions: 'Caja 30 × 20 × 10 cm · 50–60 cm de alto en total',
    occasions: ['San Valentín', 'Aniversario'],
    images: [`${IMG}/floors/rouses/rosas-damita.jpg`],
    price: null,
  },
  {
    slug: 'pack-amor',
    name: 'Pack Amor',
    category: 'rosas',
    description: 'Caja negra con cinta roja: rosas rojas, lirios y margaritas, bombones Ferrero Rocher y vino Viña Ardanza Reserva.',
    composition: ['Rosas rojas', 'Lirios', 'Margaritas', 'Bombones Ferrero Rocher', 'Vino Viña Ardanza Reserva'],
    dimensions: 'Caja 30 × 20 × 10 cm · 40–50 cm de alto en total',
    occasions: ['San Valentín', 'Aniversario'],
    images: [`${IMG}/floors/rouses/rosas-pack_amor.jpg`],
    price: null,
  },
  {
    slug: 'pack-siempre-juntos',
    name: 'Pack Siempre Juntos',
    category: 'rosas',
    description: 'Caja roja en forma de corazón con rosas, lirios y margaritas, oso de peluche, vino de San Valentín, bombones y globo LOVE.',
    composition: ['Rosas', 'Lirios', 'Margaritas', 'Oso de peluche', 'Vino de San Valentín', 'Bombones Nestlé', 'Globo LOVE'],
    dimensions: 'Caja 35 × 30 × 10 cm · 50–60 cm de alto en total',
    occasions: ['San Valentín', 'Aniversario'],
    images: [`${IMG}/floors/rouses/rosas-pack_siempre_juntos.jpg`],
    price: null,
  },
  {
    slug: 'pack-te-amo',
    name: 'Pack Te Amo',
    category: 'rosas',
    description: 'Caja roja con corazones: rosas blancas, oso de peluche, globo «te amo» y letrero LOVE.',
    composition: ['Rosas blancas', 'Oso de peluche', 'Globo «te amo»', 'Letrero LOVE'],
    dimensions: 'Caja 25 × 20 × 10 cm · 40–50 cm de alto en total',
    occasions: ['San Valentín', 'Amor'],
    images: [`${IMG}/floors/rouses/rosas-te_amo.jpg`],
    price: null,
  },

  // ——— Orquídeas ———
  {
    slug: 'orquidea-phalaenopsis',
    name: 'Orquídea Phalaenopsis',
    category: 'orquideas',
    description: 'La orquídea de interior más agradecida. Con unos cuidados sencillos florece durante semanas.',
    dimensions: '25 × 70 cm',
    watering: 'Una vez por semana',
    care: [
      'Luz indirecta y brillante.',
      'Riego: sumerge la maceta en agua tibia unos minutos, una vez por semana en verano y cada dos semanas en invierno.',
      'Abono cada 2–3 semanas durante el crecimiento.',
    ],
    images: [
      `${IMG}/floors/orchid/orquidea-phalaenopsis_1.jpg`,
      `${IMG}/floors/orchid/orquidea-phalaenopsis_2.jpg`,
      `${IMG}/floors/orchid/orquidea-orquidea-phalaenopsis_1.jpg`,
    ],
    price: null,
  },
  {
    slug: 'planta-phalaenopsis-rosa',
    name: 'Phalaenopsis rosa de 3 tallos',
    category: 'orquideas',
    description: 'Orquídea rosa con tres tallos y unos 75 cm de altura. Planta de interior originaria del sudeste asiático.',
    dimensions: '25 × 70 cm',
    watering: 'Una vez por semana',
    care: ['Luz indirecta.', 'Riego una vez por semana.'],
    images: [`${IMG}/floors/orchid/planta-phalaenospsis_1.jpg`, `${IMG}/floors/orchid/planta-phalaenospsis_2.jpg`],
    price: null,
  },

  // ——— Plantas, cestas y terrarios ———
  {
    slug: 'schefflera',
    name: 'Schefflera',
    category: 'plantas',
    description: 'Planta de interior de hoja palmeada y gran porte, originaria de Taiwán. Ideal para dar verde a salones y oficinas.',
    dimensions: '45 × 130 cm',
    watering: 'Cada 12 días aproximadamente',
    care: ['Luz intensa.', 'Temperatura entre 10 y 25 °C.', 'Riego cada 12 días.', 'Abono de mayo a septiembre.'],
    images: [`${IMG}/floors/more/planta-schefflera_1.jpg`, `${IMG}/floors/more/planta-schefflera_2.jpg`],
    price: null,
  },
  {
    slug: 'olivo-copa',
    name: 'Olivo copa',
    category: 'plantas',
    description: 'Olivo ornamental (Olea europaea) con forma de copa. Se entrega ya trasplantado: no hace falta cambiarlo de maceta.',
    dimensions: '30 cm × 1 m',
    watering: 'Una vez por semana',
    care: ['Riego una vez por semana.', 'Ya trasplantado.'],
    images: [`${IMG}/floors/more/planta-olivo_copa_1.jpg`, `${IMG}/floors/more/planta-olivo_copa_2.jpg`, `${IMG}/floors/more/planta-olivo_copa_3.jpg`],
    price: null,
  },
  {
    slug: 'planta-yucca',
    name: 'Yuca',
    category: 'plantas',
    description: 'Planta muy resistente a la sequía, perfecta si buscas poco mantenimiento. Incluye envoltorio de regalo gratuito.',
    dimensions: '25 cm × 1 m',
    watering: 'Una vez por semana',
    care: ['Riego una vez por semana.', 'Muy resistente a la sequía.'],
    images: [`${IMG}/floors/more/planta-yucca.jpg`],
    price: null,
  },
  {
    slug: 'cesta-aromas-naturales',
    name: 'Cesta Aromas Naturales',
    category: 'plantas',
    description: 'Veinte tallos de eucalipto en cesta de mimbre. Decora y perfuma con un aroma natural y relajante.',
    composition: ['Eucalipto · 20 ud.', 'Cesta de mimbre · 1 ud.'],
    dimensions: '50 × 30 cm',
    images: [`${IMG}/floors/more/cesta-aromas_naturales_1.jpg`],
    price: null,
  },
  {
    slug: 'jarron-aromas-naturales',
    name: 'Jarrón Aromas Naturales',
    category: 'plantas',
    description: 'Veinte tallos de eucalipto en jarrón. Un toque verde y aromático para cualquier rincón.',
    composition: ['Eucalipto · 20 ud.'],
    dimensions: '50 × 70 cm',
    images: [
      `${IMG}/floors/more/planta-jarron_aromas_naturales_1.jpg`,
      `${IMG}/floors/more/planta-jarron_aromas_naturales_2.jpg`,
      `${IMG}/floors/more/planta-jarron_aromas_naturales_3.jpg`,
    ],
    price: null,
  },
  {
    slug: 'cesta-alegria',
    name: 'Cesta Alegría',
    category: 'plantas',
    description: 'Cesta de mimbre blanco con orquídeas amarillas, bromelias naranjas y plantas de flor, rematada con cinta amarilla.',
    composition: ['Orquídeas amarillas', 'Bromelias naranjas', 'Plantas de flor', 'Cesta de mimbre blanco'],
    dimensions: 'Ø 25–30 cm · 40–50 cm de alto',
    images: [`${IMG}/floors/more/cesta-alegria.jpg`],
    price: null,
  },
  {
    slug: 'cesta-nacimientos',
    name: 'Cesta Nacimientos',
    category: 'plantas',
    description: 'Anthuriums rojos, calathea, kalanchoe y otras plantas verdes en recipiente blanco. Para dar la bienvenida a un recién nacido.',
    composition: ['Anthuriums rojos', 'Calathea', 'Kalanchoe', 'Plantas verdes'],
    dimensions: 'Recipiente 25–30 cm · 40–50 cm de alto',
    occasions: ['Nacimiento'],
    images: [`${IMG}/floors/more/cesta-nacimientos.jpg`],
    price: null,
  },
  {
    slug: 'caja-plantas-cactus',
    name: 'Caja de plantas con cactus',
    category: 'plantas',
    description: 'Croton, plantas de hoja fina, ciclamen o prímula e hiedra en una caja decorada con cactus pintados.',
    composition: ['Croton', 'Plantas de hoja fina', 'Ciclamen o prímula', 'Hiedra'],
    dimensions: 'Caja 30 × 20 × 15 cm · 40–50 cm de alto',
    occasions: ['Nacimiento'],
    images: [`${IMG}/floors/more/cesta-plantas_madrid.jpg`],
    price: null,
  },
  {
    slug: 'terrario-pareja-feliz',
    name: 'Terrario Pareja Feliz',
    category: 'plantas',
    description: 'Terrario hexagonal de vidrio con ficus pumila, musgo, suculentas y una figura de dos niños.',
    composition: ['Ficus pumila', 'Musgo', 'Suculentas', 'Figura decorativa'],
    dimensions: '25 cm de base · 25–30 cm de alto',
    images: [`${IMG}/floors/more/terrario-pareja_feliz.jpg`],
    price: null,
  },
  {
    slug: 'terrario-cupula-pareja',
    name: 'Terrario cúpula Pareja',
    category: 'plantas',
    description: 'Terrario de cúpula con cinta roja, ficus pumila, musgo y una figura de dos niños.',
    composition: ['Ficus pumila', 'Musgo', 'Figura decorativa', 'Cúpula de vidrio con cinta roja'],
    dimensions: '20–25 cm de base · 25–30 cm de alto',
    images: [`${IMG}/floors/more/terrario-pareja.jpg`],
    price: null,
  },

  // ——— Funerales (sin descripción en la web actual: solo galería y consulta) ———
  { slug: 'centro-funerario-azul-naranja', name: 'Centro funerario azul y naranja', category: 'funerales', description: '', images: [`${IMG}/funerals/funeral-centro_funerario_azul_y_naranja.jpeg`], price: null },
  { slug: 'centro-funerario-bidasoa', name: 'Centro funerario Bidasoa', category: 'funerales', description: '', images: [`${IMG}/funerals/funeral-centro_funerario_bidasoa.jpeg`], price: null },
  { slug: 'centro-funerario-semblante', name: 'Centro funerario Semblante', category: 'funerales', description: '', images: [`${IMG}/funerals/funeral-centro_funerario_semblante.jpeg`], price: null },
  { slug: 'centro-funerario-f12', name: 'Centro funerario F12', category: 'funerales', description: '', images: [`${IMG}/funerals/funeral-centro_funerario-F12.jpeg`], price: null },
  { slug: 'ramo-funerario', name: 'Ramo funerario', category: 'funerales', description: '', images: [`${IMG}/funerals/ramo_funerario.jpeg`], price: null },
  { slug: 'centro-funerario-espana', name: 'Centro funerario España', category: 'funerales', description: '', images: [`${IMG}/funerals/funeral-centro_funerario_espana.jpeg`], price: null },
  { slug: 'centro-funerario-f123', name: 'Centro funerario F123', category: 'funerales', description: '', images: [`${IMG}/funerals/funeral-centro-F123.jpeg`], price: null },
  { slug: 'centro-laurel-f111', name: 'Centro de laurel F111', category: 'funerales', description: '', images: [`${IMG}/funerals/funeral-centro-F111.jpeg`], price: null },
  { slug: 'corona-flores-lisboa', name: 'Corona de flores Lisboa', category: 'funerales', description: '', images: [`${IMG}/funerals/funeral-corona_lisboa.jpeg`], price: null },
];

export const getCategory = (id: CategoryId) => categories.find((c) => c.id === id)!;
export const productsIn = (id: CategoryId) => products.filter((p) => p.category === id);
export const productUrl = (p: Product) => `${getCategory(p.category).path}/${p.slug}`;
export const shopCategories = categories.filter((c) => c.id !== 'funerales');

export function formatPrice(p: Product) {
  return p.price == null
    ? 'Consultar precio'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.price);
}
