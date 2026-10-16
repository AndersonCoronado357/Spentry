<script setup lang="ts">
import { trasPintar } from '~/composables/useTema'
// Barras verticales finas. Cada barra se revela con clip-path (conserva el
// redondeo del extremo, que con scaleY se deformaría) y el globo de valor se
// desliza entre columnas en vez de saltar.
interface Punto { key: string | number; label: string; v: number; hl?: boolean; tip?: string }
interface Props {
  data: Punto[]
  format: (v: number) => string
  height?: number
  avg?: number | null
  selected?: string | number | null
  labelEvery?: number
  color?: string
  fill?: boolean   // ocupa todo el alto disponible del contenedor
  formatShort?: (v: number) => string
}
const props = withDefaults(defineProps<Props>(), { height: 160, avg: null, selected: null, labelEvery: 1, color: 'var(--accent)', fill: false })
const emit = defineEmits<{ pick: [key: string | number] }>()

// Escala: si una barra es un valor atípico (más del triple de la siguiente,
// p. ej. el arriendo), la escala se toma de las demás y esa barra se corta
// con una marca de quiebre, para que el resto no quede plano.
const orden = computed(() => [...props.data.map(d => d.v)].sort((a, b) => b - a))
const atipico = computed(() => (orden.value[1] ?? 0) > 0 && orden.value[0]! > orden.value[1]! * 3)
const max = computed(() => Math.max(1, atipico.value ? orden.value[1]! * 1.3 : orden.value[0] ?? 0))
const cortada = (v: number) => atipico.value && v > max.value
const listo = ref(false)
onMounted(() => trasPintar(() => { listo.value = true }))

const hover = ref<number | null>(null)
const activo = computed(() => {
  if (hover.value !== null) return hover.value
  const i = props.data.findIndex(d => d.key === props.selected)
  return i >= 0 ? i : null
})
function pct(v: number) { return listo.value ? Math.min(1, v / max.value) : 0 }
function clip(v: number) {
  const p = pct(v)
  // Barras en forma de píldora; los días en cero dejan un punto para que la columna exista.
  const top = (1 - Math.max(p, 0.04)) * 100
  return `inset(${top}% 0 0 0 round 999px)`
}
const avgPct = computed(() => (props.avg ? Math.min(1, props.avg / max.value) : 0))
const n = computed(() => props.data.length)
// La cifra de una barra cortada se centra sobre ella, salvo en los extremos:
// ahí se alinea hacia dentro para no salirse del margen de la tarjeta.
function lado(i: number) {
  const f = (i + 0.5) / n.value
  return f < 0.12 ? 'ini' : f > 0.88 ? 'fin' : ''
}
const hlIdx = computed(() => props.data.findIndex(d => d.hl))
function verEtiqueta(i: number) {
  if (props.data[i]?.hl) return true
  if (i % props.labelEvery !== 0) return false
  return hlIdx.value < 0 || Math.abs(i - hlIdx.value) > (props.labelEvery > 1 ? 2 : 0)
}
</script>

<template>
  <div :class="['bars', fill ? 'fill' : '']" :style="{ '--h': height + 'px' }" @pointerleave="hover = null">
    <div class="bars-plot">
      <div v-if="avg" class="bars-avg" :style="{ bottom: avgPct * 100 + '%' }">
        <span>prom.</span>
      </div>
      <div
        v-if="activo !== null && data[activo]"
        class="bars-tip"
        :style="{
          transform: `translateX(${((activo + 0.5) / n) * 100}cqw) translateX(-50%)`,
          bottom: `calc(${Math.max(pct(data[activo].v), 0.025) * 100}% + 8px)`,
        }"
      >
        <span class="faint">{{ data[activo].tip ?? data[activo].label }}</span>
        <b class="num">{{ format(data[activo].v) }}</b>
      </div>
      <button
        v-for="(d, i) in data"
        :key="d.key"
        type="button"
        class="bars-col"
        :aria-label="`${d.tip ?? d.label}: ${format(d.v)}`"
        @pointerenter="(e) => e.pointerType === 'mouse' && (hover = i)"
        @click="emit('pick', d.key)"
      >
        <span v-if="cortada(d.v) && listo" :class="['bars-cut', lado(i)]" aria-hidden="true">{{ (formatShort ?? format)(d.v) }}</span>
        <span
          :class="['bars-bar', d.hl ? 'hl' : '', activo === i ? 'on' : '']"
          :style="{ clipPath: clip(d.v), transitionDelay: listo ? `${Math.min(i, 30) * 14}ms` : '0ms', '--bar-c': color }"
        />
      </button>
    </div>
    <div class="bars-x">
      <span v-for="(d, i) in data" :key="d.key" :class="{ hl: d.hl }">
        {{ verEtiqueta(i) ? d.label : '' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.bars { width: 100%; container-type: inline-size; }
.bars.fill { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.bars-plot { position: relative; height: var(--h); display: flex; align-items: stretch; gap: clamp(3px, .8cqw, 8px); margin-top: 26px; }
.bars.fill .bars-plot { height: auto; flex: 1; min-height: 90px; }
.bars-col { position: relative; z-index: 1; flex: 1; min-width: 0; height: 100%; border: 0; padding: 0; background: transparent; cursor: pointer; display: flex; align-items: flex-end; justify-content: center; }
/* Barra que se sale de la escala (p. ej. el arriendo): llega arriba y muestra su valor. */
.bars-cut {
  position: absolute; z-index: 2; top: -20px; left: 50%; transform: translateX(-50%);
  font-size: .68rem; font-weight: 800; color: var(--text2); white-space: nowrap;
  animation: tipIn .3s .5s var(--ease-out) both;
}
.bars-bar {
  display: block; width: 100%; max-width: 26px; height: 100%;
  background: color-mix(in srgb, var(--bar-c) 38%, var(--s1));   /* tenue pero opaca */
  transition: clip-path .7s var(--ease-out), background-color .2s ease;
}
.bars-bar.hl, .bars-bar.on { background: var(--bar-c); }
.bars-avg {
  position: absolute; left: 0; right: 0; height: 0; border-top: 1.5px dashed var(--text3); opacity: .5;
  pointer-events: none; transition: bottom .6s var(--ease-out); z-index: 0;   /* por detrás de las barras */
}
.bars-avg span { position: absolute; right: 0; top: -18px; font-size: .7rem; color: var(--text3); font-weight: 700; }
.bars-tip {
  position: absolute; left: 0; z-index: 3; pointer-events: none;
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  background: var(--text); color: var(--bg); border-radius: 14px; padding: 7px 12px; white-space: nowrap;
  font-size: .74rem; font-weight: 700; line-height: 1.25;
  transition: transform .26s var(--ease-out), bottom .26s var(--ease-out);
  animation: tipIn .16s var(--ease-out);
}
.bars-tip .faint { color: inherit; opacity: .65; text-transform: capitalize; }
.bars-tip b { font-family: var(--font-title); font-size: .84rem; font-weight: 600; }
@keyframes tipIn { from { opacity: 0; } }
.bars-cut.ini { left: 0; transform: none; }
.bars-cut.fin { left: auto; right: 0; transform: none; }
.bars-x { display: flex; gap: clamp(3px, .8cqw, 8px); margin-top: 8px; flex-shrink: 0; }
.bars-x span { flex: 1; min-width: 0; text-align: center; font-size: .72rem; font-weight: 700; color: var(--text3); white-space: nowrap; overflow: visible; text-transform: capitalize; }
.bars-x span.hl { color: var(--text); }
</style>
