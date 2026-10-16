// Estado global de la interfaz: la caja registradora (registrar/editar gasto),
// el recibo abierto en detalle y los avisos (toasts).
import type { Gasto } from '~/types/gasto'

// ── Caja registradora (modal) ──────────────────────────────────
const _reg = reactive({
  abierto: false,
  gasto: null as Gasto | null,     // null = gasto nuevo
  categoria: '' as string,          // categoría preseleccionada
  instantaneo: false,               // abierto con teclado: sin animación
})

export function useRegistro() {
  function abrir(opts: { gasto?: Gasto | null; categoria?: string; instantaneo?: boolean } = {}) {
    _reg.gasto = opts.gasto ?? null
    _reg.categoria = opts.categoria ?? ''
    _reg.instantaneo = !!opts.instantaneo
    _reg.abierto = true
  }
  function cerrar() { _reg.abierto = false }
  return { reg: _reg, abrir, cerrar }
}

/** Atajo: abre la caja para registrar (opcionalmente con categoría). */
export function useRegistrar() {
  const { abrir } = useRegistro()
  return (opts: { categoria?: string } = {}) => abrir({ categoria: opts.categoria })
}

// ── Recibo en detalle (modal) ──────────────────────────────────
const _detalle = ref<string | null>(null)
export function useDetalle() {
  return {
    detalleId: _detalle,
    verRecibo: (id: string) => { _detalle.value = id },
    cerrarRecibo: () => { _detalle.value = null },
  }
}

// ── Avisos ─────────────────────────────────────────────────────
export interface Toast {
  id: number
  title: string
  body?: string
  icon?: string
  action?: { label: string; run: () => void }
  duration: number
}
const _toasts = ref<Toast[]>([])
let seq = 0

export function useToast() {
  function cerrar(id: number) { _toasts.value = _toasts.value.filter(t => t.id !== id) }
  function mostrar(t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) {
    const toast: Toast = { duration: t.action ? 5500 : 3200, ...t, id: ++seq }
    // Máximo 3 a la vez: el más viejo sale.
    _toasts.value = [..._toasts.value.slice(-2), toast]
    return toast.id
  }
  return { toasts: _toasts, mostrar, cerrar }
}
