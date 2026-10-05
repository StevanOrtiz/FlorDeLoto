// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://flordlotosegovia.com',
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  // Las páginas del catálogo y el panel se generan bajo demanda desde Neon.
  // Las páginas fijas (legales, 404, contacto) declaran `export const prerender = true`.
  output: 'server',
  adapter: vercel(),
  // URLs antiguas → 301 para conservar posicionamiento.
  redirects: {
    '/contact': { status: 301, destination: '/contacto' },
    '/privacity': { status: 301, destination: '/politica-de-privacidad' },
    '/legal': { status: 301, destination: '/aviso-legal' },
    '/cookies': { status: 301, destination: '/politica-de-cookies' },
    // Orquídeas y «más flores» se unen en Plantas.
    '/orquideas-segovia': { status: 301, destination: '/plantas-segovia' },
    '/mas-flores-segovia': { status: 301, destination: '/plantas-segovia' },
    // Con parámetros dinámicos Astro usa la forma de texto (redirección permanente por defecto en GET).
    '/orquideas-segovia/[slug]': '/plantas-segovia/[slug]',
    '/mas-flores-segovia/[slug]': '/plantas-segovia/[slug]',
  },
  env: {
    schema: {
      DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_GSC_VERIFICATION: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  // CSS en línea: evita peticiones que bloquean el primer pintado en móvil.
  build: { inlineStylesheets: 'always' },
  // Sin scripts en línea: permite una CSP estricta (script-src 'self').
  vite: { build: { assetsInlineLimit: 0 } },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
