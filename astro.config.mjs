// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://flordlotosegovia.com',
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  output: 'static',
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      i18n: undefined,
    }),
  ],
  // URLs antiguas de la web Angular → 301 para conservar posicionamiento.
  redirects: {
    '/contact': { status: 301, destination: '/contacto' },
    '/privacity': { status: 301, destination: '/politica-de-privacidad' },
    '/legal': { status: 301, destination: '/aviso-legal' },
    '/cookies': { status: 301, destination: '/politica-de-cookies' },
  },
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
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
