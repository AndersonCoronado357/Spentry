<script setup lang="ts">
// Selector de fecha compacto para la caja: chip "Hoy" que abre atajos
// (Hoy / Ayer) y un calendario. No permite fechas futuras.
import { hoy, addDays, sameDay, dayLabel, MESES, DIAS_MIN } from '~/composables/useDatos'

const props = defineProps<{ modelValue: Date }>()
const emit = defineEmits<{ 'update:modelValue': [v: Date] }>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const view = ref(new Date(props.modelValue))
watch(() => props.modelValue, v => { view.value = new Date(v) })
watch(open, o => { if (o) view.value = new Date(props.modelValue) })

const y = computed(() => view.value.getFullYear())
const m = computed(() => view.value.getMonth())
// Siempre 6 semanas (42 días): el calendario no cambia de alto entre meses.
const cells = computed(() => {
  const start = (new Date(y.value, m.value, 1).getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(y.value, m.value, 1 - start + i, 12)
    return { d, fuera: d.getMonth() !== m.value }
  })
})
const dir = ref<'next' | 'prev'>('next')
function mover(delta: number) {
  dir.value = delta > 0 ? 'next' : 'prev'
  view.value = new Date(y.value, m.value + delta, 1)
}
const esFuturo = (d: Date) => d.getTime() > new Date(hoy().setHours(23, 59, 59, 999)).getTime()
const puedeAvanzar = computed(() => new Date(y.value, m.value + 1, 1) <= hoy())

function pick(d: Date) {
  const x = new Date(d); x.setHours(12, 0, 0, 0)
  emit('update:modelValue', x)
  open.value = false
}
const atajos = computed(() => [
  { label: 'Hoy', d: hoy() },
  { label: 'Ayer', d: addDays(hoy(), -1) },
  { label: 'Anteayer', d: addDays(hoy(), -2) },
])
</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    :class="['chip', 'date-chip', open ? 'on' : '']"
    @click="open = !open"
  >
    <StIcon name="calendar" :size="16" />
    <span>{{ dayLabel(modelValue) }}</span>
  </button>
  <StPopover :anchor="triggerRef" :open="open" :width="304" align="right" fit @close="open = false">
    <div class="cal">
      <div class="row" style="gap: 6px; padding: 2px 2px 10px">
        <button
          v-for="a in atajos"
          :key="a.label"
          type="button"
          :class="['chip', sameDay(a.d, modelValue) ? 'on' : '']"
          style="padding: 8px 12px; font-size: .82rem"
          @click="pick(a.d)"
        >{{ a.label }}</button>
      </div>
      <div class="cal-head">
        <button type="button" class="cal-nav" aria-label="Mes anterior" @click="mover(-1)">
          <StIcon name="chevronLeft" :size="18" />
        </button>
        <span class="cal-title-wrap">
          <Transition :name="`mes-${dir}`" mode="out-in">
            <span :key="`${y}-${m}`" class="cal-title">{{ MESES[m] }} {{ y }}</span>
          </Transition>
        </span>
        <button type="button" class="cal-nav" aria-label="Mes siguiente" :disabled="!puedeAvanzar" :style="{ opacity: puedeAvanzar ? 1 : .3 }" @click="puedeAvanzar && mover(1)">
          <StIcon name="chevronRight" :size="18" />
        </button>
      </div>
      <div class="cal-grid cal-dows">
        <div v-for="d in DIAS_MIN" :key="d" class="cal-dow">{{ d }}</div>
      </div>
      <Transition :name="`mes-${dir}`" mode="out-in">
        <div :key="`${y}-${m}`" class="cal-grid">
          <button
            v-for="c in cells"
            :key="c.d.toDateString()"
            type="button"
            :disabled="esFuturo(c.d)"
            :class="['cal-day', c.fuera ? 'fuera' : '', sameDay(c.d, modelValue) ? 'sel' : '', sameDay(c.d, hoy()) ? 'today' : '']"
            @click="pick(c.d)"
          >{{ c.d.getDate() }}</button>
        </div>
      </Transition>
    </div>
  </StPopover>
</template>
