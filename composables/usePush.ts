// Manejo de notificaciones push en el cliente: pedir permiso, suscribir el
// navegador al Web Push del servidor y recordar la preferencia.
const LS_KEY = 'spentry-notif'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function usePush() {
  const soportado = ref(false)
  const activo = ref(false)
  const ocupado = ref(false)
  const error = ref<string | null>(null)

  onMounted(() => {
    soportado.value =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    if (!soportado.value) return
    // Solo se considera activo si el permiso sigue concedido y el usuario lo dejó encendido.
    activo.value = Notification.permission === 'granted' && localStorage.getItem(LS_KEY) === '1'
  })

  async function suscribir(): Promise<PushSubscription> {
    const reg = await navigator.serviceWorker.ready
    const existente = await reg.pushManager.getSubscription()
    if (existente) return existente
    const { key } = await $fetch<{ key: string }>('/api/push/vapid')
    if (!key) throw new Error('Servidor sin VAPID configurado')
    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    })
  }

  async function activar(): Promise<boolean> {
    if (!soportado.value || ocupado.value) return false
    ocupado.value = true
    error.value = null
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        error.value = 'Permiso de notificaciones denegado.'
        activo.value = false
        return false
      }
      const sub = await suscribir()
      await $fetch('/api/push/subscribe', { method: 'POST', body: sub.toJSON() })
      localStorage.setItem(LS_KEY, '1')
      activo.value = true
      return true
    } catch (e) {
      error.value = 'No se pudo activar las notificaciones.'
      activo.value = false
      return false
    } finally {
      ocupado.value = false
    }
  }

  async function desactivar(): Promise<void> {
    if (ocupado.value) return
    ocupado.value = true
    error.value = null
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        try {
          await $fetch('/api/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } })
        } catch {
          /* el endpoint podría ya no existir */
        }
        await sub.unsubscribe()
      }
    } catch {
      /* noop */
    } finally {
      localStorage.setItem(LS_KEY, '0')
      activo.value = false
      ocupado.value = false
    }
  }

  async function alternar(v: boolean): Promise<void> {
    if (v) await activar()
    else await desactivar()
  }

  return { soportado, activo, ocupado, error, activar, desactivar, alternar }
}
