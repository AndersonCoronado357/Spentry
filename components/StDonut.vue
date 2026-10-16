<script setup lang="ts">
import { trasPintar } from '~/composables/useTema'
// Dona por categoría. Separación de 2px entre segmentos; al elegir uno los
// demás se atenúan y el centro muestra su valor. Los segmentos se trazan al
// montar y se redistribuyen con transición al cambiar los datos.
interface Seg { id: string; value: number; color: string; label: string }
interface Props { segs: Seg[]; selected?: string | null; size?: number; center: string; caption: string }
const props = withDefaults(defineProps<Props>(), { selected: null, size: 0 })
const emit = defineEmits<{ pick: [id: string | null] }>()

const R = 42
const C = 2 * Math.PI * R
const GAP = 2
const listo = ref(false)
onMounted(() => trasPintar(() => { listo.value = true }))

const totalV = computed(() => props.segs.reduce((s, x) => s + x.value, 0))
const arcs = computed(() => {
  let acc = 0
  return props.segs.map((s) => {
    const frac = totalV.value ? s.value / totalV.value : 0
    const len = Math.max(0, frac * C - (props.segs.length > 1 ? GAP : 0))
    const a = { ...s, len: listo.value ? len : 0, off: -acc }
    acc += frac * C
    return a
  })
})
</script>

<template>
  <div class="donut" :style="size ? { width: size + 'px', height: size + 'px' } : undefined">
    <svg viewBox="0 0 100 100" role="img" :aria-label="caption">
      <circle cx="50" cy="50" :r="R" fill="none" stroke="var(--s2)" stroke-width="10" />
      <circle
        v-for="a in arcs"
        :key="a.id"
        cx="50" cy="50" :r="R" fill="none"
        :stroke="a.color"
        :stroke-width="selected === a.id ? 12.5 : 10"
        :stroke-dasharray="`${a.len} ${C}`"
        :stroke-dashoffset="a.off"
        :class="['donut-seg', selected && selected !== a.id ? 'dim' : '']"
        transform="rotate(-90 50 50)"
        @click="emit('pick', selected === a.id ? null : a.id)"
      />
    </svg>
    <div class="donut-center">
      <Transition name="swap" mode="out-in">
        <span :key="center" class="col" style="align-items: center; gap: 2px">
          <b class="num">{{ center }}</b>
          <span>{{ caption }}</span>
        </span>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.donut { position: relative; flex-shrink: 0; aspect-ratio: 1; height: 100%; min-height: 170px; }
.donut svg { width: 100%; height: 100%; display: block; overflow: visible; }
.donut-seg {
  cursor: pointer;
  transition: stroke-dasharray .8s var(--ease-out), stroke-dashoffset .8s var(--ease-out), opacity .2s ease, stroke-width .2s var(--ease-out);
}
.donut-seg.dim { opacity: .28; }
.donut-center {
  position: absolute; inset: 0; display: grid; place-items: center; text-align: center; pointer-events: none;
}
.donut-center b { font-family: var(--font-title); font-size: 1.3rem; font-weight: 600; letter-spacing: -.01em; color: var(--text); }
.donut-center span span { font-size: .76rem; font-weight: 700; color: var(--text3); max-width: 9em; }
</style>
