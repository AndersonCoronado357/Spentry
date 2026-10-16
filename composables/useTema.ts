// Tema claro / oscuro / sistema. Persiste en localStorage y aplica data-theme
// al <html> (los popovers y hojas en portal heredan las variables CSS).

export type TemaPref = 'light' | 'dark' | 'system'
type Tema = 'light' | 'dark'

const LS = 'spentry-tema'
const _pref = ref<TemaPref>('system')
const _tema = ref<Tema>('light')
let mq: MediaQueryList | null = null

const THEME_COLOR: Record<Tema, string> = { light: '#F4F4F5', dark: '#0E0F0D' }

function resolver(p: TemaPref): Tema {
  if (p !== 'system') return p
  return mq?.matches ? 'dark' : 'light'
}

function pintar(t: Tema) {
  _tema.value = t
  const d = document.documentElement
  d.setAttribute('data-theme', t)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[t])
}

export function useTema() {
  function inicializar() {
    if (typeof window === 'undefined') return
    mq ||= window.matchMedia('(prefers-color-scheme: dark)')
    try {
      const s = localStorage.getItem(LS)
      if (s === 'light' || s === 'dark' || s === 'system') _pref.value = s
    } catch {}
    pintar(resolver(_pref.value))
    mq.addEventListener('change', () => { if (_pref.value === 'system') pintar(resolver('system')) })
  }

  /**
   * Cambia el tema. Si se pasa el punto de origen (x, y) y el navegador soporta
   * View Transitions, el nuevo tema se revela en círculo desde ahí.
   */
  function aplicar(p: TemaPref, origen?: { x: number; y: number }) {
    _pref.value = p
    try { localStorage.setItem(LS, p) } catch {}
    const destino = resolver(p)
    if (destino === _tema.value) return
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!doc.startViewTransition || reduce || !origen) { pintar(destino); return }
    const r = Math.hypot(Math.max(origen.x, innerWidth - origen.x), Math.max(origen.y, innerHeight - origen.y))
    const root = document.documentElement.style
    root.setProperty('--vt-x', `${origen.x}px`)
    root.setProperty('--vt-y', `${origen.y}px`)
    root.setProperty('--vt-r', `${r}px`)
    doc.startViewTransition(() => pintar(destino))
  }

  return { tema: _tema, pref: _pref, aplicar, inicializar }
}

// Media query reactivo (cliente).
export function useMediaQuery(query: string) {
  const matches = ref(false)
  if (typeof window === 'undefined') return matches
  const m = window.matchMedia(query)
  matches.value = m.matches
  const handler = (e: MediaQueryListEvent) => { matches.value = e.matches }
  onMounted(() => { matches.value = m.matches; m.addEventListener('change', handler) })
  onBeforeUnmount(() => m.removeEventListener('change', handler))
  return matches
}

export function prefiereMenosMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Vibración corta (Android). En iOS/escritorio no hace nada. */
export function tactil(patron: number | number[] = 8) {
  try { if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(patron) } catch {}
}

/**
 * Ejecuta `fn` una vez tras el primer pintado (doble rAF), con un temporizador
 * de respaldo: en pestañas en segundo plano rAF se pausa y la animación de
 * entrada nunca arrancaría, dejando el valor en cero.
 */
export function trasPintar(fn: () => void) {
  let hecho = false
  const go = () => { if (!hecho) { hecho = true; fn() } }
  requestAnimationFrame(() => requestAnimationFrame(go))
  setTimeout(go, 120)
}
