# Flor de Loto Segovia · Web

Web de la floristería **Flor de Loto Segovia** (P.º Conde de Sepúlveda, 24, Segovia). Hecha con
[Astro](https://astro.build) (renderizado bajo demanda), con animaciones de scroll (GSAP + Lenis), el catálogo
y las fotos en **Neon (Postgres)**, un panel de administración y lista para desplegar en Vercel.

## Puesta en marcha

```bash
npm install
cp .env.example .env          # y rellena DATABASE_URL con la cadena de Neon
npm run dev                   # http://localhost:4321
```

| Comando | Qué hace |
|---|---|
| `npm run dev` / `build` / `check` | Desarrollo, compilación de producción y comprobación de tipos |
| `npm run db:seed` | Carga el catálogo inicial (`db/seed/catalog.json` + `db/seed/images`) en Neon. Es idempotente; `-- --force` vuelve a cargar también las fotos |
| `npm run admin:create` | Crea la cuenta de administrador (ver más abajo) |

Requiere Node 22.18 o superior.

## Base de datos (Neon)

El esquema está en `db/schema.sql` (todas las sentencias son idempotentes). Tablas: `categories`, `products`,
`product_images` (fotos en WebP, completa y miniatura), `admin_users` (una única fila), `admin_sessions`,
`rate_limits` y `contact_messages` (formulario de contacto).

Neon suspende el cómputo tras unos minutos sin uso y lo reactiva solo en la siguiente consulta (alrededor de un
segundo): el proyecto no se pausa ni se borra. Las páginas públicas se guardan 1 minuto en la CDN
(`s-maxage=60`), así que un cambio del panel se ve en menos de un minuto.

## Panel de administración (`/admin`)

Una única cuenta de administrador con CRUD completo del catálogo: crear, editar (datos, precio, visible,
destacado), eliminar productos, y subir, ordenar, describir y borrar sus fotos.

**Alta de la cuenta** (una vez; la contraseña se pasa solo para esa ejecución y no se guarda en ningún archivo):

```bash
ADMIN_EMAIL=correo@ejemplo.com ADMIN_PASSWORD='una contraseña larga' npm run admin:create
# Para cambiar el correo o la contraseña (cierra todas las sesiones abiertas):
ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create -- --reset
```

**Seguridad:**
- Contraseña con **scrypt** (sal única, comparación en tiempo constante), mínimo 12 caracteres.
- Sesión: token aleatorio de 256 bits; en la base de datos solo se guarda su hash. Cookie `__Host-` con
  `HttpOnly`, `Secure` y `SameSite=Strict`; dura 8 h renovables, con un máximo de 24 h; cerrar sesión la revoca.
- **Bloqueo por IP** tras 5 intentos fallidos en 15 minutos (15 min, luego 30 y 60), más un freno global que
  ralentiza los intentos si hay muchos fallos seguidos. El bloqueo es por IP y no por cuenta a propósito: si
  fuera por cuenta, cualquiera podría dejar fuera al administrador fallando adrede.
- Mensaje de error genérico y mismo tiempo de respuesta con correos que no existen.
- Todo cambio exige comprobación de `Origin` y token CSRF (`src/middleware.ts`).
- Fotos: se valida el contenido real (no la extensión), solo JPEG, PNG y WebP, y se reconvierten a WebP (se
  descartan metadatos y GPS). El panel las reduce en el navegador antes de subirlas, porque Vercel limita el
  cuerpo de una petición a ~4,5 MB.
- El panel responde con `no-store`, `noindex` y `X-Frame-Options: DENY`.

## Estructura

```
db/schema.sql, db/seed/    esquema de Neon y catálogo inicial (catalog.json + fotos originales)
src/
  data/            business.json (datos del negocio), reviews.ts
  lib/             db, catalog (consultas), auth, password, ratelimit, product-input, validation, site
  middleware.ts    protección de /admin y /api/admin
  layouts/         Base.astro (web pública, SEO), Admin.astro (panel)
  components/      Header, Footer, ProductCard, ContactForm, CookieConsent, admin/ProductForm…
  pages/           web pública, /admin, /api/admin, /api/contact, /media/[id], sitemap.xml, robots.txt
  scripts/         animations.ts, consent.ts, admin.ts
scripts/           seed.mjs, create-admin.mjs
```

Menú, de izquierda a derecha: **Rosas · Ramos · Plantas · Funerario · Bodas & eventos** (`src/lib/site.ts`).
Orquídeas, cestas y terrarios están dentro de Plantas, con filtro por tipo.

## URLs y redirecciones

Se conservan las URLs de la web antigua. Redirigen con **301** (`astro.config.mjs`): `/contact`, `/privacity`,
`/legal`, `/cookies`, `/orquideas-segovia` y `/mas-flores-segovia` (y sus productos) → `/plantas-segovia`.
El `sitemap.xml` se genera desde la base de datos.

## Despliegue (Vercel)

1. Importar el repositorio en Vercel (framework: Astro). El HTTPS es automático.
2. Variables de entorno (`.env.example`): `DATABASE_URL` (obligatoria) y, opcionales, `PUBLIC_TURNSTILE_SITE_KEY`,
   `TURNSTILE_SECRET_KEY` y `PUBLIC_GSC_VERIFICATION`. Son solo de servidor (salvo las `PUBLIC_`).
3. Crear la cuenta de administrador con `npm run admin:create` (contra la misma base de datos).
4. Apuntar el dominio a Vercel.
5. En Google Search Console: verificar la propiedad y enviar `https://<dominio>/sitemap.xml`.

### Seguridad de la web

- Cabeceras en `vercel.json`: HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- La CSP permite un único script en línea (las clases `js`/`js-anim` en `Base.astro`) mediante su **hash**.
  Si cambias ese script, recalcula el `sha256-…` y actualiza `vercel.json`.
- Los datos del catálogo se escapan al mostrarse y el JSON-LD escapa `<`.
- Formulario de contacto: validación y sanitización en cliente y servidor, honeypot, tiempo mínimo de relleno,
  límite por IP (en la base de datos), comprobación de origen y Turnstile opcional.
- Si la contraseña de la base de datos se expuso alguna vez (chat, capturas), rótala en la consola de Neon y
  actualiza `DATABASE_URL`.

## Datos pendientes del cliente (en la web aparecen como «[Pendiente: …]» o no se muestran)

- [ ] Nombre o razón social y NIF/CIF (y datos registrales si es sociedad): obligatorio para el aviso legal.
- [ ] Correo electrónico de contacto (aviso legal, privacidad y pie de página).
- [ ] Correo y contraseña de la cuenta de administrador.
- [ ] Confirmar que el WhatsApp es el mismo número: +34 691 26 41 12.
- [ ] Horario real del sábado y del domingo (Google muestra el sábado de 10:00 a 02:00, probable error).
- [ ] Lista oficial de precios (se rellenan desde el panel).
- [ ] Zonas y coste de envío, y plazos de encargo en fechas de alta demanda.
- [ ] Logo vectorial y fotos originales en alta resolución (se cambian desde el panel).
- [ ] Permiso para mostrar nombres de clientes (ahora solo el nombre de pila) y del equipo.
- [ ] Confirmar el dominio (flordlotosegovia.com) y la página de Facebook.
- [ ] Revisión de los textos legales por un profesional.
