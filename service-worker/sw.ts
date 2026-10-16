/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

// Assets versionados del build (nombres con hash → seguros de cachear). @vite-pwa
// inyecta la lista en __WB_MANIFEST durante el build. El manifiesto queda fuera:
// al instalar la app el navegador debe leer siempre el publicado (colores de la
// barra del sistema y de la pantalla de inicio), nunca una copia vieja en caché.
precacheAndRoute(self.__WB_MANIFEST.filter(e => (typeof e === 'string' ? e : e.url) !== 'manifest.webmanifest'))
cleanupOutdatedCaches()

// autoUpdate: tomar control de inmediato para no servir versiones viejas.
self.addEventListener('install', () => {
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Notificación push (recordatorio diario enviado desde el servidor).
self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string; tag?: string; url?: string } = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  const title = data.title || 'Spentry'
  const body = data.body || '¿Ya anotaste tus gastos de hoy?'
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: data.tag || 'spentry',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      requireInteraction: false,
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
    } as NotificationOptions),
  )
})

// Al tocar la notificación: llevar la pestaña abierta a la URL (abre la caja
// para registrar) o abrir la app si no hay ninguna.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientsArr) => {
      const client = clientsArr.find((c) => 'focus' in c) as WindowClient | undefined
      if (client) {
        await client.focus()
        if ('navigate' in client) await client.navigate(url).catch(() => undefined)
        return
      }
      await self.clients.openWindow(url)
    }),
  )
})
