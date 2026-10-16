<script setup lang="ts">
// Avisos apilados: el más nuevo adelante y los anteriores asoman detrás,
// más pequeños. Al pasar el mouse se despliegan. Se descartan deslizándolos
// hacia el lado (basta un gesto rápido). El tiempo de vida es la barrita
// inferior: se pausa con el mouse encima o con la pestaña oculta.
const { toasts, cerrar } = useToast()
const oculto = ref(false)
const abierto = ref(false)
function vis() { oculto.value = document.hidden }
onMounted(() => document.addEventListener('visibilitychange', vis))
onBeforeUnmount(() => document.removeEventListener('visibilitychange', vis))

const ALTO = 68
const GAP = 8
function estilo(i: number, n: number) {
  const idx = n - 1 - i                       // 0 = el más nuevo
  const y = abierto.value ? -idx * (ALTO + GAP) : -idx * 12
  const s = abierto.value ? 1 : 1 - idx * 0.05
  return { '--y': `${y}px`, '--s': s, zIndex: 10 - idx, opacity: idx > 2 ? 0 : 1 }
}

// Deslizar para descartar.
const drag = reactive<{ id: number | null; dx: number; x0: number; t0: number }>({ id: null, dx: 0, x0: 0, t0: 0 })
function down(e: PointerEvent, id: number) {
  if ((e.target as HTMLElement).closest('button')) return
  drag.id = id; drag.dx = 0; drag.x0 = e.clientX; drag.t0 = performance.now()
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function move(e: PointerEvent, id: number) {
  if (drag.id !== id) return
  const d = e.clientX - drag.x0
  drag.dx = d > 0 ? d : -Math.sqrt(-d) * 2   // hacia la izquierda, con resistencia
}
function up(id: number) {
  if (drag.id !== id) return
  const v = drag.dx / Math.max(1, performance.now() - drag.t0)
  if (drag.dx > 90 || (v > 0.3 && drag.dx > 20)) cerrar(id)
  drag.id = null; drag.dx = 0
}
function accion(t: { id: number; action?: { run: () => void } }) {
  t.action?.run()
  cerrar(t.id)
}
</script>

<template>
  <Teleport to="body">
    <div
      :class="['toaster', { paused: oculto || abierto, abierto }]"
      :style="{ '--stack-h': abierto ? `${toasts.length * (ALTO + GAP)}px` : `${ALTO + 24}px` }"
      aria-live="polite"
      @mouseenter="abierto = true"
      @mouseleave="abierto = false"
    >
      <TransitionGroup name="toast">
        <div
          v-for="(t, i) in toasts"
          :key="t.id"
          :class="['toast', drag.id === t.id ? 'dragging' : '']"
          role="status"
          :style="{ ...estilo(i, toasts.length), '--dx': drag.id === t.id ? `${drag.dx}px` : '0px' }"
          @pointerdown="e => down(e, t.id)"
          @pointermove="e => move(e, t.id)"
          @pointerup="up(t.id)"
          @pointercancel="up(t.id)"
        >
          <span v-if="t.icon" class="toast-ic"><StIcon :name="t.icon" :size="18" /></span>
          <span class="col grow" style="gap: 2px; min-width: 0">
            <span class="toast-title ellipsis">{{ t.title }}</span>
            <span v-if="t.body" class="toast-body ellipsis">{{ t.body }}</span>
          </span>
          <button v-if="t.action" type="button" class="toast-act" @click="accion(t)">{{ t.action.label }}</button>
          <button type="button" class="toast-x" aria-label="Cerrar aviso" @click="cerrar(t.id)">
            <StIcon name="x" :size="15" />
          </button>
          <i class="toast-life" :style="{ animationDuration: t.duration + 'ms' }" @animationend="cerrar(t.id)" />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
