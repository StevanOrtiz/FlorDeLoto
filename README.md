# Flor de Loto Segovia · Web

Web de la floristería **Flor de Loto Segovia** (P.º Conde de Sepúlveda, 24, Segovia). Hecha con
[Astro](https://astro.build), con animaciones de scroll (GSAP + Lenis) y lista para desplegar en Vercel.

## Comandos

```bash
npm install
npm run dev      # desarrollo en http://localhost:4321
npm run check    # comprobación de tipos (TypeScript + Astro)
npm run build    # compilación de producción (.vercel/output)
npm run images   # descarga las fotos del catálogo y las guarda en WebP (public/img/products)
```

**Nota:** `npm run images` activa `NODE_USE_ENV_PROXY=1` para que Node use el proxy cuando exista (entornos en la nube); en tu ordenador no hace nada.

**Primera vez:** ejecuta `npm run images` para descargar las fotos desde flordlotosegovia.com. Se guardan
optimizadas en `public/img/products` y la web ya no depende de la web antigua. Después, súbelas al
repositorio (`git add public/img`). Cuando el cliente entregue fotos originales, sustitúyelas en esa misma
carpeta con el mismo nombre.

## Estructura

```
src/
  data/            business.json (datos del negocio), products.ts (catálogo), reviews.ts
  lib/             site.ts (enlaces y menú), validation.ts (validación compartida del formulario)
  layouts/Base.astro   SEO: title, description, canonical, Open Graph, JSON-LD (Florist)
  components/      Header, Footer, ProductCard, ContactForm, CookieConsent, MapEmbed…
  pages/           páginas y el endpoint /api/contact
  scripts/         animations.ts (animaciones de scroll), consent.ts (consentimiento de cookies)
  styles/global.css    tokens de diseño: paleta, tipografía, espaciado
supabase/schema.sql    tabla para los mensajes del formulario
```

### Animaciones

Se declaran con atributos en el HTML (`data-reveal`, `data-split`, `data-stagger`, `data-parallax`,
`data-zoom`, `data-count`, `data-hscroll`); ver `src/scripts/animations.ts`. Con
`prefers-reduced-motion`, o si el JavaScript falla, todo el contenido queda visible.

### Catálogo

Los productos se editan en `src/data/products.ts`. Para publicar un precio, rellena `price` (en euros);
mientras tanto se muestra «Consultar precio». Cada producto tiene su página, su URL y datos estructurados
`Product`.

## URLs y redirecciones

Se conservan las URLs de la web antigua (`/ramos-flores-segovia`, `/rosas-segovia`, `/orquideas-segovia`,
`/mas-flores-segovia`, `/bodas-eventos-segovia`, `/funerales-segovia`). Las que cambian redirigen con
**301** (`astro.config.mjs`): `/contact`, `/privacity`, `/legal`, `/cookies`.

## Despliegue (Vercel)

1. Importar el repositorio en Vercel (framework: Astro). El HTTPS es automático.
2. Variables de entorno (`.env.example`):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: al conectar Supabase (ejecutar antes `supabase/schema.sql`).
     **Solo servidor**: nunca llegan al navegador.
   - `PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`: anti-spam de Cloudflare Turnstile (opcional,
     recomendado).
   - `PUBLIC_GSC_VERIFICATION`: código de verificación de Google Search Console.
3. Apuntar el dominio a Vercel.
4. En Google Search Console: verificar la propiedad y enviar `https://<dominio>/sitemap-index.xml`.

Sin Supabase configurado, el formulario valida, pero en producción responde que no está disponible y
propone WhatsApp: no se pierde ningún mensaje en silencio.

### Seguridad

- Cabeceras en `vercel.json`: HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- La CSP permite un único script en línea (las clases `js`/`js-anim` en `Base.astro`) mediante su **hash**.
  Si cambias ese script, recalcula el `sha256-…` y actualiza `vercel.json`.
- Formulario: validación y sanitización en cliente y servidor, honeypot, tiempo mínimo de relleno, límite
  por IP, comprobación de origen y Turnstile opcional.
- Sin cuentas de usuario ni pagos: los pedidos van por WhatsApp, teléfono o plataformas de terceros.

## Datos pendientes del cliente (en la web aparecen como «[Pendiente: …]» o no se muestran)

- [ ] Nombre o razón social y NIF/CIF (y datos registrales si es sociedad): obligatorio para el aviso legal.
- [ ] Correo electrónico de contacto (aviso legal, privacidad y pie de página).
- [ ] Confirmar que el WhatsApp es el mismo número: +34 691 26 41 12.
- [ ] Horario real del sábado y del domingo (Google muestra el sábado de 10:00 a 02:00, probable error).
- [ ] Lista oficial de precios.
- [ ] Zonas y coste de envío, y plazos de encargo en fechas de alta demanda.
- [ ] Logo vectorial y fotos originales en alta resolución (hoy se usan las de la web antigua, descargadas con `npm run images`).
- [ ] Permiso para mostrar nombres de clientes (ahora solo el nombre de pila) y del equipo.
- [ ] Confirmar el dominio (flordlotosegovia.com) y la página de Facebook.
- [ ] Revisión de los textos legales por un profesional.
