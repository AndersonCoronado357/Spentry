// https://nuxt.com/docs/api/configuration/nuxt-config

// ── SEO y vista previa al compartir ─────────────────────────────
// La app es SPA (ssr:false): lo que leen Google, los previsualizadores de enlaces
// (WhatsApp, Telegram, X, Facebook, LinkedIn) y las IAs que no ejecutan
// JavaScript tiene que venir en este HTML inicial. Ver también public/robots.txt,
// public/sitemap.xml y public/llms.txt.
const SITIO = 'https://spentry.acmsy.com'
const TITULO = 'Spentry — Anota tus gastos y mira a dónde va tu dinero'
const DESCRIPCION =
  'Anota tus gastos en segundos, organízalos por categorías y mira a dónde va tu dinero con estadísticas claras. Spentry funciona en el celular y en la PC.'
const DESCRIPCION_CORTA = 'Anota cada gasto en segundos, organízalo por categorías y mira a dónde va tu dinero.'
const IMAGEN = `${SITIO}/og-image.png`
const IMAGEN_ALT =
  'Spentry: «Anota cada gasto. Mira a dónde va tu dinero.» junto a un recibo con gastos de café, transporte, almuerzo y mercado.'
const FUNCIONES = [
  'Registro de gastos en segundos con un teclado tipo caja registradora',
  'Cada gasto queda guardado como un recibo con número de folio',
  'Categorías personalizables con nombre, icono y color',
  'Movimientos por mes con búsqueda y filtro por categoría',
  'Estadísticas: total del mes, comparación con el mes anterior, gasto día a día, por categoría y de los últimos 6 meses',
  'Presupuesto mensual opcional',
  'Recordatorio diario por notificación',
  'Exportación de todos los gastos a un archivo CSV',
  'Varias monedas: peso colombiano, dólar, euro, peso mexicano, sol peruano y peso chileno',
  'Modo claro, oscuro o según el sistema',
  'Se instala como app en el celular o en la PC',
  'Inicio de sesión con correo o con Google',
]
const DATOS_ESTRUCTURADOS = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITIO}/#sitio`,
      url: `${SITIO}/`,
      name: 'Spentry',
      description: DESCRIPCION,
      inLanguage: 'es',
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITIO}/#app`,
      name: 'Spentry',
      url: `${SITIO}/`,
      description: DESCRIPCION,
      applicationCategory: 'FinanceApplication',
      applicationSubCategory: 'Control de gastos personales',
      operatingSystem: 'Android, iOS, Windows, macOS y Linux (desde el navegador)',
      browserRequirements: 'Requiere JavaScript y un navegador moderno.',
      inLanguage: 'es',
      image: IMAGEN,
      screenshot: IMAGEN,
      featureList: FUNCIONES,
      isPartOf: { '@id': `${SITIO}/#sitio` },
    },
  ],
}

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  // Desactivado: @nuxt/devtools hace un import('vite') que rompe el build limpio
  // en Docker (npm install fresco); no aporta nada en producción.
  devtools: { enabled: false },

  // SPA: se renderiza solo en el cliente (el estado vive en el navegador).
  ssr: false,

  // Cloudflare guardaba sw.js hasta 4 horas: la app instalada seguía con el
  // service worker viejo y este le servía el manifiesto viejo (colores claros en
  // la barra del sistema y la pantalla de inicio). Estos dos archivos nunca se
  // cachean, así cada despliegue llega de inmediato.
  routeRules: {
    '/sw.js': { headers: { 'cache-control': 'no-store, no-cache, must-revalidate, max-age=0' } },
    '/manifest.webmanifest': { headers: { 'cache-control': 'no-store, no-cache, must-revalidate, max-age=0' } },
    // Archivos para buscadores e IAs: como mucho una hora en caché.
    '/robots.txt': { headers: { 'cache-control': 'public, max-age=3600' } },
    '/sitemap.xml': { headers: { 'cache-control': 'public, max-age=3600' } },
    '/llms.txt': { headers: { 'cache-control': 'public, max-age=3600' } },
  },

  devServer: {
    port: 3040,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@vite-pwa/nuxt',
  ],

  app: {
    // Las transiciones de página las maneja el layout (ver layout.css · .page-*).
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: false,
    head: {
      htmlAttrs: { lang: 'es' },
      title: TITULO,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: DESCRIPCION },
        { name: 'application-name', content: 'Spentry' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
        { name: 'format-detection', content: 'telephone=no' },
        // Verificación de la propiedad en Google Search Console.
        { name: 'google-site-verification', content: 'kQccDg7SPoW-KuDF8XOWxtDYuiBCJzRwH06gh-D-16E' },
        // Open Graph: vista previa en WhatsApp, Telegram, Facebook, LinkedIn…
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Spentry' },
        { property: 'og:locale', content: 'es_CO' },
        { property: 'og:url', content: `${SITIO}/` },
        { property: 'og:title', content: TITULO },
        { property: 'og:description', content: DESCRIPCION_CORTA },
        { property: 'og:image', content: IMAGEN },
        { property: 'og:image:secure_url', content: IMAGEN },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: IMAGEN_ALT },
        // X (Twitter)
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: TITULO },
        { name: 'twitter:description', content: DESCRIPCION_CORTA },
        { name: 'twitter:image', content: IMAGEN },
        { name: 'twitter:image:alt', content: IMAGEN_ALT },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Spentry' },
      ],
      link: [
        { rel: 'canonical', href: `${SITIO}/` },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
        // Opaco (fondo papel): iOS pinta la transparencia sobre negro y saldría un recuadro.
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      style: [
        {
          // Fondo del tema desde el primer cuadro, antes de que cargue el CSS de
          // la app: al abrirla en oscuro no hay destello blanco.
          innerHTML:
            'html{background:#F4F4F5;color-scheme:light}html[data-theme=dark]{background:#0E0F0D;color-scheme:dark}@media (prefers-color-scheme:dark){html:not([data-theme=light]){background:#0E0F0D;color-scheme:dark}}',
          tagPosition: 'head',
        },
      ],
      script: [
        {
          // Fija el tema guardado y crea la etiqueta theme-color (barra de estado)
          // con su color antes del primer pintado. La etiqueta no va en `meta`:
          // Nuxt la volvería a escribir con un valor fijo al montar la app y la
          // barra parpadearía (oscuro → claro → oscuro). Luego la actualiza useTema.
          // 'system' sigue al sistema.
          innerHTML:
            "(function(){var d=document.documentElement;try{var t=localStorage.getItem('spentry-tema')||'system';if(t==='system'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){t='light';d.setAttribute('data-theme','light');}var m=document.createElement('meta');m.name='theme-color';m.content=t==='dark'?'#0E0F0D':'#F4F4F5';document.head.appendChild(m);})()",
          tagPosition: 'head',
        },
        // Datos estructurados: qué es Spentry, para Google y las IAs.
        { type: 'application/ld+json', innerHTML: JSON.stringify(DATOS_ESTRUCTURADOS) },
      ],
      // Texto para quien no ejecuta JavaScript (IAs y lectores que solo leen el HTML).
      noscript: [
        {
          tagPosition: 'bodyOpen',
          innerHTML:
            `<h1>Spentry</h1><p>${DESCRIPCION}</p><ul>${FUNCIONES.map(f => `<li>${f}</li>`).join('')}</ul>` +
            `<p>Para usar Spentry activa JavaScript en tu navegador.</p>`,
        },
      ],
    },
  },

  css: ['~/assets/css/main.css', '~/assets/css/layout.css', '~/assets/css/receipt.css'],

  googleFonts: {
    families: {
      // Redondeadas y limpias: Parkinsans para títulos y cifras, Nunito para el texto.
      Parkinsans: [400, 500, 600, 700],
      Nunito: [400, 500, 600, 700, 800],
    },
    display: 'swap',
    preconnect: true,
  },

  pwa: {
    registerType: 'autoUpdate',
    // SW propio para poder manejar los eventos push / notificationclick.
    strategies: 'injectManifest',
    srcDir: 'service-worker',
    filename: 'sw.ts',
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    },
    manifest: {
      name: 'Spentry',
      short_name: 'Spentry',
      description: DESCRIPCION,
      id: '/',
      scope: '/',
      lang: 'es',
      dir: 'ltr',
      categories: ['finance', 'productivity', 'utilities'],
      // Android pinta con estos colores la barra de navegación del sistema y la
      // pantalla de inicio de la app instalada (no siguen el tema en vivo).
      // theme_color = barra inferior oscura de la app; background_color = fondo
      // del ícono adaptable, así el splash muestra solo el logo, sin recuadro.
      theme_color: '#171917',
      background_color: '#161618',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        // Maskable con fondo lleno: Android lo enmascara y una transparencia
        // se vería como recuadro negro en el splash / launcher.
        { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [
        { name: 'Registrar gasto', short_name: 'Registrar', url: '/?registrar=1', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      ],
    },
    // Permite registrar y probar el SW en `nuxt dev`.
    devOptions: { enabled: true, type: 'module', suppressWarnings: true },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
