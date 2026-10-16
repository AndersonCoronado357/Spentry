<script setup lang="ts">
// Fila de gasto. Toque = ver el recibo. Deslizar a la izquierda = anular
// (con fricción si se arrastra al revés y descarte por velocidad, sin exigir
// llegar al umbral si el gesto fue rápido).
import type { Gasto } from '~/types/gasto'
import { catPorId, formatMoney, folioStr, fmtTime } from '~/composables/useDatos'
import { tactil } from '~/composables/useTema'

interface Props { gasto: Gasto; swipe?: boolean; showDate?: boolean; dateLabel?: string; active?: boolean }
const props = withDefaults(defineProps<Props>(), { swipe: true, showDate: false, active: false })
const emit = defineEmits<{ open: [id: string]; remove: [id: string] }>()

const cat = computed(() => catPorId(props.gasto.category))
const fgRef = ref<HTMLElement | null>(null)
const dragging = ref(false)
const dx = ref(0)
const armado = ref(false)
const saliendo = ref(false)

let x0 = 0, y0 = 0, t0 = 0, decidido: 'h' | 'v' | null = null, pid: number | null = null, movido = false

function down(e: PointerEvent) {
  if (!props.swipe || pid !== null || e.button > 0) return
  pid = e.pointerId; x0 = e.clientX; y0 = e.clientY; t0 = performance.now()
  decidido = null; movido = false
}
function move(e: PointerEvent) {
  if (e.pointerId !== pid) return
  const ddx = e.clientX - x0, ddy = e.clientY - y0
  if (!decidido) {
    if (Math.abs(ddx) > 8 && Math.abs(ddx) > Math.abs(ddy)) {
      decidido = 'h'; dragging.value = true; movido = true
      fgRef.value?.setPointerCapture(e.pointerId)
    } else if (Math.abs(ddy) > 8) { decidido = 'v'; pid = null; return }
    else return
  }
  // Hacia la derecha no hay acción: resistencia creciente.
  dx.value = ddx < 0 ? ddx : Math.sqrt(ddx) * 2
  const w = fgRef.value?.offsetWidth ?? 300
  const ahora = -dx.value > w * 0.42
  if (ahora !== armado.value) { armado.value = ahora; tactil(ahora ? 10 : 4) }
}
function up(e: PointerEvent) {
  if (e.pointerId !== pid) return
  pid = null
  if (!dragging.value) return
  dragging.value = false
  const w = fgRef.value?.offsetWidth ?? 300
  const v = -dx.value / Math.max(1, performance.now() - t0)
  if (-dx.value > w * 0.42 || (v > 0.11 && -dx.value > 36)) {
    saliendo.value = true
    dx.value = -w - 24
    setTimeout(() => emit('remove', props.gasto.id), 190)
  } else {
    dx.value = 0
  }
  armado.value = false
}
function click() {
  if (movido) { movido = false; return }
  emit('open', props.gasto.id)
}
const progreso = computed(() => Math.min(1, -dx.value / 90))
</script>

<template>
  <div class="grow-row" :class="{ saliendo, swiping: dragging || dx !== 0 }">
    <div v-if="swipe && (dragging || dx !== 0)" class="gr-bg" :style="{ opacity: progreso }" aria-hidden="true">
      <span :class="['gr-bin', armado ? 'armado' : '']"><StIcon name="trash" :size="20" /></span>
    </div>
    <button
      ref="fgRef"
      type="button"
      :class="['gr-fg', dragging ? 'dragging' : '', active ? 'active' : '']"
      :style="dx ? { transform: `translateX(${dx}px)` } : undefined"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
      @click="click"
    >
      <StCatIcon :icon="cat.icon" :color="cat.color" :size="42" />
      <span class="col grow" style="gap: 3px; align-items: flex-start; text-align: left">
        <span class="gr-title ellipsis">{{ gasto.note || cat.label }}</span>
        <span class="gr-sub ellipsis">
          {{ gasto.note ? cat.label : 'Sin nota' }}
          <template v-if="showDate"> · {{ dateLabel }}</template>
          <template v-else> · {{ fmtTime(gasto.createdAt) }}</template>
        </span>
      </span>
      <span class="col" style="gap: 3px; align-items: flex-end; flex-shrink: 0">
        <span class="gr-amt num">{{ formatMoney(gasto.amount, gasto.currency) }}</span>
        <span class="gr-folio">N.º {{ folioStr(gasto.folio) }}</span>
      </span>
    </button>
  </div>
</template>
