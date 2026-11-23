# Blueprint técnico: web de floristería con catálogo, panel de administración y buscador

> Documento pensado para que una IA (o una persona) **replique todo el sistema para otro negocio** (otra floristería u otro comercio con catálogo). Describe qué hace la web, cómo está construida, la lógica de cada pieza y qué hay que cambiar para otro cliente. Origen: «Flor de Loto Segovia» (https://flordelotosegovia.co, España/UE). Todo lo de aquí se ha comprobado en el código del repositorio.

---

## 1. Resumen en 10 líneas

- Web pública de catálogo (sin carrito ni pagos): el cliente ve productos y **pide por WhatsApp o teléfono**.
- **Astro 7** con `output: 'server'` (renderizado bajo demanda); las páginas fijas usan `export const prerender = true`.
- **Base de datos Neon (Postgres serverless)** guarda catálogo, categorías, **fotos (bytea WebP)**, cuenta de administrador, sesiones, límites de intentos y mensajes de contacto.
- **Panel `/admin`** con **una única cuenta** y CRUD completo de productos y fotos.
- **Buscador** con sugerencias en vivo + página `/buscar`: sin tildes, plurales, sinónimos, erratas (pg_trgm) y palabras clave por producto.
- **Seguridad**: scrypt, sesiones con token hasheado, cookie `__Host-`, CSRF + Origin, bloqueo por IP, CSP/HSTS, validación en servidor.
- **SEO**: URLs limpias, canonical, Open Graph, JSON-LD (`Florist`, breadcrumbs, `ItemList`, `Product`), `sitemap.xml` dinámico, `robots.txt`, 301 desde URLs antiguas.
- **Legal España/UE**: aviso legal, privacidad (RGPD/LOPDGDD), cookies con consentimiento previo (estilo AEPD); Google Maps solo se carga tras aceptar.
- **Animaciones** de scroll (GSAP + Lenis), diseño responsive, accesible (WCAG), fuentes autoalojadas.
- **Despliegue**: Netlify (adaptador `@astrojs/netlify`) o Vercel (`@astrojs/vercel`); mismas cabeceras de seguridad en ambos.

---

## 2. Stack y dependencias clave

| Capa | Elección | Notas |
|---|---|---|
| Framework | Astro 7.x, TypeScript estricto | `trailingSlash: 'never'`, `build.inlineStylesheets: 'always'`, `vite.build.assetsInlineLimit: 0` |
| Adaptador | `@astrojs/netlify` si `process.env.NETLIFY`, si no `@astrojs/vercel` | Selector en `astro.config.mjs` |
| BD | Neon Postgres + `@neondatabase/serverless` (HTTP) | Sin conexiones persistentes; cliente creado **de forma perezosa** (`src/lib/db.ts`) |
| Imágenes | `sharp` (en servidor al subir) | Se guardan en la BD, no en un bucket |
| Animación | `gsap` (+ ScrollTrigger, Flip) y `lenis` | Respeta `prefers-reduced-motion` |
| Fuentes | `@fontsource-variable` (Fraunces y DM Sans) | Autoalojadas: sin peticiones a Google Fonts |
| Antispam opcional | Cloudflare Turnstile | Solo si hay claves en variables de entorno |
| Entorno | `astro:env` (esquema tipado) | `DATABASE_URL` (secreto, opcional en el esquema), `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_GSC_VERIFICATION` |
| Node | ≥ 22.18 | |

Scripts npm: `dev`, `build`, `check`, `preview`, `db:seed`, `admin:create`, `db:migrate-search`, `db:keywords`.

---

## 3. Mapa de rutas

### Públicas (renderizadas en servidor salvo indicación)
| Ruta | Qué hace |
|---|---|
| `/` | Portada: hero, tarjetas de categorías, «Los más pedidos» (`featured`), servicios, reseñas, ubicación, canales de pedido |
| `/catalogo` | Todo el catálogo (excepto funerales) con filtros por categoría animados (GSAP Flip) |
| `/[category]` | Lista de una categoría (`/rosas-segovia`, `/ramos-flores-segovia`, `/plantas-segovia`); filtros por `subcategory` si hay ≥2 |
| `/[category]/[slug]` | Ficha de producto: galería, descripción, composición, medidas, cuidados, riego, ocasiones, precio, **botón «Pedir por WhatsApp» con enlace del producto**, JSON-LD `Product`, relacionados |
| `/funerales-segovia` | Página propia de la categoría `funerales` (tarjetas con «Consultar» por WhatsApp); **no sale en el sitemap** |
| `/bodas-eventos-segovia` | Página de servicio con formulario de presupuesto (`kind: 'evento'`) |
| `/cuidado-de-plantas` | Guía de cuidados |
| `/contacto` | Tarjetas WhatsApp/teléfono/Instagram, formulario (`kind: 'contacto'`), ubicación, horario |
| `/buscar?q=…&categoria=…` | Resultados del buscador (`noindex`) |
| `/aviso-legal`, `/politica-de-privacidad`, `/politica-de-cookies` | Legales (`prerender = true`), con marcadores «[Pendiente: …]» si falta un dato del titular |
| `/media/[id]?s=thumb` | Sirve una foto desde la BD (`immutable`, ETag) |
| `/sitemap.xml`, `/robots.txt` | Dinámico desde la BD / estático |
| `/api/search?q=` | Sugerencias JSON (máx. 6) |
| `/api/contact` (POST) | Guarda el formulario |
| `/api/health` | Dice si hay conexión con la BD (sin exponer datos) |
| `404` | `prerender = false`; las rutas desconocidas hacen `Astro.rewrite('/404')` |
| 301 | `/contact`, `/privacity`, `/legal`, `/cookies`, `/orquideas-segovia`, `/mas-flores-segovia` y sus fichas (rutas propias `*/[slug].ts`) |

### Administrador (todas `noindex`, `no-store`, protegidas por middleware)
`/admin/login`, `/admin` (lista con búsqueda y filtro), `/admin/productos/nuevo`, `/admin/productos/[id]`; API: `POST /api/admin/login`, `POST /api/admin/logout`, `POST /api/admin/products`, `PUT|DELETE /api/admin/products/[id]`, `POST /api/admin/products/[id]/images`, `PATCH|DELETE /api/admin/images/[id]`.

El enlace al panel está en el pie de página como un **candado discreto** (`rel="nofollow"`, `robots.txt` bloquea `/admin` y `/api/`).

---

## 4. Modelo de datos (`db/schema.sql`, idempotente)

```
categories(id text pk ^[a-z]+$, name, short, path unique ^/[a-z0-9-]+$, title, description, intro, sort_order)
products(id uuid pk, slug unique ^[a-z0-9]+(-[a-z0-9]+)*$ ≤80, category_id fk, subcategory ≤40,
         name 2–120, description ≤2000, composition text[], dimensions ≤120, care text[], watering ≤120,
         occasions text[], keywords text[], price numeric(8,2) null, published bool, featured bool,
         sort_order int, created_at, updated_at)
product_images(id uuid pk, product_id fk ON DELETE CASCADE, position int, alt ≤200, mime,
               data_full bytea (WebP ≤1400px), data_thumb bytea (WebP 640px), created_at)
admin_users(id boolean pk default true CHECK(id)  ← fuerza UNA sola fila, email lower, password_hash)
admin_sessions(token_hash pk (sha256), expires_at, created_at, ip, user_agent)
rate_limits(key pk, window_start, count, locked_until)
contact_messages(id, kind 'contacto'|'evento', nombre, email, telefono, asunto, tipo_evento, fecha_evento,
                 lugar, mensaje 10–3000, consentimiento CHECK(true), consentimiento_at, atendido bool, created_at)
```
Extensiones: `unaccent`, `pg_trgm`; función `f_unaccent(text)` inmutable (envoltorio de `unaccent`).

Reglas de negocio:
- Las **categorías son fijas** (4: rosas, ramos, plantas, funerales); el admin no las edita. Cada negocio nuevo define las suyas en el seed.
- `price` nulo ⇒ la web muestra «Consultar precio».
- `published=false` oculta el producto de la web, sitemap y buscador.
- `featured=true` lo muestra en la portada («Los más pedidos»).
- El **orden** de un producto nuevo es `max(sort_order)+1` dentro de su categoría; las fotos se ordenan por `position`.
- Las fotos van en la BD: ~8 MB para 60 fotos; cada subida tiene `id` nuevo, por eso la caché es `immutable`.

---

## 5. Lógica del catálogo (`src/lib/catalog.ts`)

- `getProducts({category, featured, all, search, limit})`: SQL parametrizado con `json_agg` de imágenes; orden `categoría.sort_order, producto.sort_order, nombre`. `all` incluye ocultos (solo admin).
- `getProductBySlug(categoryId, slug)`, `getProductById`, `getCategories/ByPath/ById`.
- `toProduct(row)` convierte filas en el tipo `Product` (rutas de imagen `/media/{id}` y `?s=thumb`).
- `productUrl(p)` = `categoryPath/slug`; `formatPrice` en EUR (`es-ES`); `cover(p)` = primera foto.
- **`productWaLink(p, mensaje)`**: `https://wa.me/{numero}?text=` + mensaje + salto de línea + URL absoluta de la ficha (`SITE_URL` + `productUrl`). Se usa en la ficha, las tarjetas y los funerarios, para que quien atiende sepa qué producto es.
- Caché de páginas públicas: `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=600` (`cachePublic`). Un cambio del admin se ve en <1 min.
- Si la BD falla las páginas públicas fallan; **mejora pendiente**: página 503 amable con teléfono/WhatsApp.

---

## 6. Buscador (`src/lib/search.ts`, `/api/search`, `/buscar`, `SearchOverlay.astro`, `src/scripts/search.ts`)

**Interfaz**: lupa en la cabecera (también tecla `/`) abre un cuadro modal con sugerencias en vivo (debounce 160 ms, mín. 2 letras, `AbortController`), foto, nombre, categoría y precio; flechas ↑↓ + Intro; Esc cierra; foco atrapado; roles ARIA `combobox/listbox`. Sin JS, la lupa es un enlace a `/buscar`. Las sugerencias se pintan con `textContent` (sin `innerHTML`), así que no hay XSS.

**Algoritmo** (`parseQuery` + `buildSearchQuery`):
1. Normaliza (NFD sin tildes, minúsculas), deja `[a-z0-9]`, quita stopwords (`de, la, el, para, con…`), máx. 6 palabras de 2–30 letras.
2. **Stem de plurales** simple (`-es`, `-s`): «rosas»→«rosa», «claveles»→«clavel».
3. **Sinónimos** (`SYNONYMS`, grupos editables): cumple/cumpleaños, novia/boda, amor/romántico/san valentín, funeral/pésame/luto/tanatorio, orquídea/phalaenopsis, regalo/pack, preservada/eterna…
4. En SQL, un `LATERAL` calcula los campos normalizados con `f_unaccent(lower(...))`: `nm`(nombre), `kw`(keywords), `tg`(subcategoría + **nombre corto** de categoría + ocasiones), `cp`(composición), `ds`(descripción).
5. Puntuación por alternativa: nombre 10, keywords 7, tags 5, composición 4, descripción 2 (`LIKE %alt%`). Además **fuzzy** con `word_similarity` (solo para la palabra escrita, no sinónimos): umbral 0.6 (4 letras), 0.5 (5), 0.42 (≥6).
6. Cada palabra puede dar varias alternativas (`greatest`); **todas las palabras deben coincidir** en algún campo (`AND`); puntuación total = suma; orden `score desc, categoría, orden, nombre`.
7. Solo productos `published`; filtro opcional por categoría; `limit` 6 (API) o 100 (página).
- Todo con parámetros (`$n`); lo escrito nunca se concatena en el SQL.
- `/api/search` responde `Cache-Control` público 1 min (misma consulta no vuelve a la BD).
- Lección: usar el **nombre corto** de la categoría (no el largo «Plantas y orquídeas») para no hacer que todo lo de esa categoría coincida con «orquídea».

**Palabras clave**: campo `keywords` editable en el panel (texto separado por comas; máx. 30 de 40 caracteres; sin duplicados insensibles a tildes). `scripts/add-keywords.mjs` genera una propuesta a partir de lo que cada producto *ya dice* (nombre, categoría, ocasiones…), sin inventar; con `--apply` solo rellena los que tienen la lista vacía.

---

## 7. Panel de administración

**Acceso único**: `admin_users` admite una sola fila. Alta/cambio de contraseña con `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create [-- --reset]` (la contraseña no se guarda en archivos; mín. 12 caracteres; `--reset` cierra todas las sesiones).

**Login (`POST /api/admin/login`)**
1. Lee JSON ≤2 KB; calcula IP (`clientAddress` o `x-forwarded-for`).
2. Si la IP está bloqueada → 429 + `Retry-After`.
3. Busca el usuario; **siempre** verifica un hash (real o `dummyHash` precalculado) para igualar tiempos.
4. Error genérico «Correo o contraseña incorrectos.» (401) y registra fallo.
5. Éxito: borra fallos, crea sesión, cookie `__Host-fdl_admin` (`HttpOnly; Secure; SameSite=Strict; Path=/`, 8 h).

**Contraseñas**: scrypt (N=32768, r=8, p=1, sal 16 B, 64 B), formato `scrypt$N$r$p$salt$hash` (parámetros viajan con el hash), comparación en tiempo constante, `NFKC`.

**Sesiones**: token de 32 bytes aleatorios (base64url); en BD solo `sha256(token)`. Cada petición renueva `expires_at = least(created_at+24h, now()+8h)` (**sliding 8 h, máx. 24 h**). Logout borra la fila.

**CSRF**: token = `HMAC-SHA256(sessionToken, 'fdl-csrf')`, enviado en cabecera `x-csrf-token` en cada petición que cambia datos + comprobación de `Origin` (mismo host). Todo en `src/middleware.ts`, que además fuerza `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `X-Frame-Options: DENY` en `/admin` y `/api/admin`.

**Bloqueo**: 5 fallos en 15 min por **IP** (no por cuenta, para que nadie pueda dejar fuera al dueño) ⇒ bloqueo 15 → 30 → 60 min; freno global (20 fallos/h ⇒ +2,5 s de retraso).

**CRUD de producto**: formulario único (`ProductForm.astro` + `src/scripts/admin.ts`). Campos: nombre*, slug (autogenerado y editable; avisa que cambiarlo rompe el enlace antiguo), categoría*, subcategoría/tipo, precio, descripción, composición y cuidados (uno por línea), medidas, riego, ocasiones (comas), **palabras clave** (comas), visible, destacado. `parseProduct()` valida y limpia **en servidor** (control chars, longitudes, slug, precio 0–99999,99, listas). `409` si el slug ya existe. Borrar producto borra sus fotos (`CASCADE`).

**Fotos**: subida multipart (máx. 4 MB por foto y 12 por producto; el panel las reduce en el navegador antes de subir por el límite de cuerpo de las funciones). El servidor valida el **contenido real** con `sharp` (solo JPEG/PNG/WebP, `limitInputPixels` 50 MP), aplica `rotate()`, **reconvierte siempre a WebP** (completa 1400 px q80, miniatura 640 px q75; así se eliminan metadatos/GPS) y guarda ambas. `PATCH` cambia el texto alternativo o mueve ↑/↓; `DELETE` la borra.

---

## 8. Formulario de contacto (`/api/contact`)

Capas antispam y de seguridad, en este orden: Origin del mismo sitio → `Content-Type` JSON → tamaño ≤20 KB → **honeypot** (`website`) + **tiempo mínimo de relleno** (3 s; campo `ts`) — a los bots se les responde `ok` sin guardar → **límite por IP** 5 envíos/10 min (`rate_limits`) → **Turnstile** opcional (solo si hay `TURNSTILE_SECRET_KEY`) → `normalize()` (quita etiquetas y control chars) + `validate()` (nombre, email, teléfono, asunto o tipo de evento, mensaje ≥10, **consentimiento obligatorio**) → `insert` en `contact_messages` con `consentimiento_at`. Los mensajes se leen en Neon (el panel aún no tiene bandeja; mejora posible). Política RGPD sugerida: borrar atendidos a los 12 meses.

---

## 9. SEO y contenido

- `Base.astro`: `<title>` (añade el nombre del negocio), meta description, canonical (de `SITE_URL`, sin barra final), Open Graph/Twitter, `noindex` opcional, JSON-LD `Florist` con dirección, geo, horarios, valoración y redes (`@id: SITE_URL/#florist`), `BreadcrumbList`, `ItemList` (catálogo) y `Product` en fichas. JSON-LD escapa `<` para evitar inyección. Meta `google-site-verification` desde `PUBLIC_GSC_VERIFICATION`.
- `sitemap.xml`: estáticas + categorías + productos publicados (con `lastmod` = `updated_at`), excluyendo funerales; `robots.txt` con `Disallow: /admin` y `/api/`.
- Datos del negocio en **`src/data/business.json`** (nombre, tagline, teléfono, `whatsappNumber`, dirección, geo, mapas, horarios, redes, canales de pedido, comodidades, valoración, datos legales) y reseñas en `src/data/reviews.ts`. **Nunca se inventan datos**: los que faltan aparecen como «[Pendiente: …]» (`Pending.astro`).
- Textos: reescritos para SEO local («floristería en Segovia», «entrega a domicilio»); URLs con ciudad (`/rosas-segovia`).

---

## 10. Seguridad, privacidad y cumplimiento

- **Cabeceras** (idénticas en `netlify.toml`, `vercel.json` y `src/lib/security-headers.ts`, que las añade el middleware porque las páginas de función no reciben las del archivo): CSP estricta (`script-src 'self'` + **hash sha256 del único script en línea** de `Base.astro` + Turnstile; `img-src 'self' data: blob:`; `frame-src` Google Maps/Turnstile; `connect-src 'self'`), HSTS preload, `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy. **Si cambias el script en línea, recalcula el hash en los tres sitios.**
- **Cookies**: banner de consentimiento (Aceptar / Rechazar / Configurar, igual de visibles), preferencia en `localStorage` (`fdl-consent`), reabrible desde el pie («Configurar cookies»). Google Maps **solo se carga tras consentir**; sin analítica. Solo cookies técnicas (la de sesión del admin).
- Secretos solo en variables de entorno de servidor; nada de claves en el front; consultas siempre parametrizadas; contenido del usuario escapado al renderizar.
- Legal ES/UE: aviso legal (LSSI), privacidad (RGPD/LOPDGDD) y cookies; **requiere datos reales del titular** (razón social/NIF, email) y revisión profesional.
- Rotar la contraseña de la BD si se expuso; backups: usar snapshots/branches de Neon.

---

## 11. Frontend y UX

- Diseño propio con tokens CSS (`src/styles/global.css`: paleta crema/rosa/vino/salvia/verde bosque; Fraunces + DM Sans), mobile-first, secciones animadas por scroll (`data-reveal`, `data-stagger`, `data-split`, paralaje, marquesina), cabecera que se oculta al bajar, menú móvil a pantalla completa, botón flotante de WhatsApp/llamar (`FloatingActions`), `prefers-reduced-motion` respetado.
- Componentes: `Header`, `Footer` (candado admin), `Logo` (imagen WebP transparente; variante clara para fondo oscuro), `ProductCard` (doble foto al hover, WhatsApp con enlace), `PageHero`, `Breadcrumbs`, `OrderChannels`, `Location`, `MapEmbed` (tras consentimiento), `Reviews`, `ContactForm`, `CookieConsent`, `SearchOverlay`, `Pending`, `Icon` (SVG inline).
- Menú, izquierda→derecha: **Rosas · Ramos · Plantas · Funerario · Bodas & eventos**, y «Contacto» como botón aparte.

---

## 12. Cómo replicarlo para otro negocio (checklist)

1. **Crear repo** desde este código. Cambiar `package.json` (`name`), `SITE_URL` en `src/lib/site.ts` y `site` en `astro.config.mjs`.
2. **Datos del negocio**: rellenar `src/data/business.json` (nombre, tagline, teléfono, `whatsappNumber` en formato internacional sin `+`, dirección, geo, horarios, redes, canales, legal) y `src/data/reviews.ts` (solo reseñas reales con permiso). Sustituir logo (`public/img/brand/logo.webp` y `logo-light.webp`), favicon, `og-image.jpg`, `apple-touch-icon.png`, `site.webmanifest`.
3. **Categorías**: editar el seed (`db/seed/catalog.json → categories`: `id`, `name`, `short`, `path`, `title`, `description`, `intro`, `sort_order`) y ajustar `nav` y `footerCategories` en `site.ts`. Si el negocio no tiene «funerales», quitar `funerales-segovia.astro` y las referencias a `id === 'funerales'` (sitemap, `[category]/index.astro`, catálogo). Cambiar el sufijo de ciudad en las rutas (`-segovia`) y en los 301 de `astro.config.mjs`.
4. **Neon**: crear proyecto (región UE si el público es UE), copiar `DATABASE_URL` a `.env` y a las variables del hosting; aplicar `db/schema.sql` (o ejecutar `npm run db:migrate-search` tras crear las tablas).
5. **Cargar catálogo**: `db/seed/catalog.json` + `db/seed/images/*.webp`, luego `npm run db:seed` (⚠️ sobrescribe campos de productos con el mismo `slug`; no usarlo sobre un catálogo ya editado en el panel). Alternativa: crear los productos desde `/admin`.
6. **Administrador**: `ADMIN_EMAIL=… ADMIN_PASSWORD='…≥12…' npm run admin:create`.
7. **Palabras clave**: `npm run db:keywords` (vista previa) → `-- --apply`; completar desde el panel. Ajustar `SYNONYMS` y `searchSuggestions` al vocabulario del nuevo negocio.
8. **Textos/SEO**: reescribir títulos, descripciones, `PageHero` y secciones de `index.astro`; actualizar JSON-LD (`@type` `Florist` → `Store`/otro tipo schema.org si no es floristería).
9. **Legal**: completar `business.json → legal`, revisar las 3 páginas legales y su jurisdicción.
10. **Despliegue**: Netlify (`netlify.toml`; variables `DATABASE_URL` etc.; dominio y HTTPS automáticos) o Vercel (`vercel.json`). Verificar `/api/health`, `/sitemap.xml`, `/robots.txt`, login y CRUD.
11. **Search Console**: verificar el dominio (TXT en DNS o `PUBLIC_GSC_VERIFICATION`) y enviar `/sitemap.xml`.
12. Si se quieren pagos online: añadir un proveedor de confianza (Stripe/Redsys) con claves en variables de entorno de servidor; hoy no hay pagos.

### Qué cambiar según el tipo de negocio
- **Tienda de otro rubro**: el modelo `products` sirve tal cual; renombrar campos específicos de flores (`composition`, `care`, `watering`, `occasions`) o dejarlos vacíos.
- **Más de un administrador**: quitar `check (id)` de `admin_users`, añadir `id uuid` y un selector por email en login; mantener el resto.
- **Almacenamiento de fotos**: para muchos productos, mover `bytea` a un bucket (S3/R2/Neon storage) y guardar solo URL.
- **Carrito/pedidos**: añadir tablas `orders`, `order_items` y una pasarela; la arquitectura (middleware, validación, rate limit) se reutiliza.

---

## 13. Lecciones aprendidas y trampas conocidas

- **Cliente de BD perezoso**: si `DATABASE_URL` se exige al importar, la compilación falla en el hosting. Se declara opcional en `astro:env` y `db.ts` lanza un error claro al primer uso.
- **Netlify**: las variables marcadas como «secret» desde el conector no persistieron; se usó variable normal. Tras cambiar variables hay que **redesplegar**. Las funciones no reciben las cabeceras del `netlify.toml` → por eso `withSecurityHeaders` en el middleware.
- **Astro**: `Astro.rewrite('/404')` hacia una página prerenderizada da 500 → `404.astro` con `prerender = false`. Redirecciones dinámicas con `[slug]` en `astro.config.mjs` se generan mal → usar rutas propias (`orquideas-segovia/[slug].ts`).
- **Header con `backdrop-filter`** actúa como bloque contenedor de elementos `fixed` hijos: el menú móvil y el buscador se colocan **fuera** del `<header>`.
- **Estilos de Astro con `scoped`** no llegan a nodos creados por scripts: usar `:global()` (sugerencias del buscador).
- **bytea**: el driver HTTP puede devolver `Buffer` o texto hex (`\x…`); `/media/[id]` maneja ambos.
- **Slugs ≠ nombres**: al renombrar productos desde el panel el slug no cambia (a propósito, para no romper enlaces).
- **Seed destructivo** sobre catálogo editado: úsalo solo en una BD nueva.
- **Límite de cuerpo** de funciones (~4,5 MB): reducir fotos en el navegador antes de subirlas.
- **Fuentes y animaciones** en dispositivos lentos: CSS en línea, fuentes autoalojadas, `loading="lazy"` salvo las 3 primeras tarjetas.

---

## 14. Plantilla de prompt para pedir la réplica a una IA

> Replica el proyecto descrito en `docs/BLUEPRINT.md` para **[NOMBRE DEL NEGOCIO]** en **[CIUDAD, PAÍS]**. Datos: teléfono/WhatsApp **[…]**, dirección **[…]**, horario **[…]**, redes **[…]**, categorías **[lista con id, nombre, ruta]**, jurisdicción legal **[ES/UE | otra]**, dominio **[…]**, hosting **[Netlify|Vercel]**, y la lista de productos **[CSV/JSON con nombre, categoría, precio, descripción, ocasiones, foto]**. Mantén el stack (Astro + Neon), la seguridad del panel (scrypt, sesión hasheada, CSRF, bloqueo por IP), el buscador (unaccent + pg_trgm + sinónimos + keywords) y los mensajes de WhatsApp con enlace del producto. No inventes datos: marca como «[Pendiente: …]» lo que falte. Entrega: esquema SQL, seed, páginas, panel, scripts, cabeceras CSP, README y checklist de despliegue.
