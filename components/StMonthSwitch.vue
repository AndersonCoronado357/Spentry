<script setup lang="ts">
// Selector de mes ‹ Octubre 2026 ›. La etiqueta entra desde el lado hacia el
// que se navega (izquierda = mes anterior), para que el cambio tenga dirección.
import { MESES, MESES_COR, hoy } from '~/composables/useDatos'

const props = defineProps<{ y: number; m: number; corto?: boolean }>()
const emit = defineEmits<{ change: [y: number, m: number] }>()

const dir = ref<'next' | 'prev'>('next')
const esActual = computed(() => props.y === hoy().getFullYear() && props.m === hoy().getMonth())
const label = computed(() => `${(props.corto ? MESES_COR : MESES)[props.m]} ${props.y}`)

function mover(delta: number) {
  if (delta > 0 && esActual.value) return
  dir.value = delta > 0 ? 'next' : 'prev'
  const d = new Date(props.y, props.m + delta, 1)
  emit('change', d.getFullYear(), d.getMonth())
}
</script>

<template>
  <div :class="['month-switch', corto ? 'corto' : '']">
    <button type="button" class="iconbtn bare sm" aria-label="Mes anterior" @click="mover(-1)">
      <StIcon name="chevronLeft" :size="18" />
    </button>
    <span class="month-label">
      <Transition :name="`month-${dir}`">
        <span :key="label" class="month-text">{{ label }}</span>
      </Transition>
    </span>
    <button type="button" class="iconbtn bare sm" aria-label="Mes siguiente" :disabled="esActual" :style="{ opacity: esActual ? .3 : 1 }" @click="mover(1)">
      <StIcon name="chevronRight" :size="18" />
    </button>
  </div>
</template>

<style scoped>
.month-switch { display: inline-flex; align-items: center; gap: 2px; background: var(--s2); border-radius: 999px; padding: 3px; }
.month-switch .iconbtn.sm:hover { background: var(--s3); }
.month-label { position: relative; display: inline-grid; min-width: 9.5em; height: 1.4em; overflow: hidden; text-align: center; }
.corto .month-label { min-width: 5.4em; }
.month-text {
  grid-area: 1 / 1; font-family: var(--font-title); font-weight: 600; font-size: .92rem;
  text-transform: capitalize; white-space: nowrap; color: var(--text);
}
.month-next-enter-active, .month-prev-enter-active { transition: transform .32s var(--ease-out), opacity .32s var(--ease-out), filter .32s var(--ease-out); }
.month-next-leave-active, .month-prev-leave-active { transition: transform .2s ease, opacity .2s ease, filter .2s ease; }
.month-next-enter-from { transform: translateX(40%); opacity: 0; filter: blur(3px); }
.month-next-leave-to   { transform: translateX(-40%); opacity: 0; filter: blur(3px); }
.month-prev-enter-from { transform: translateX(-40%); opacity: 0; filter: blur(3px); }
.month-prev-leave-to   { transform: translateX(40%); opacity: 0; filter: blur(3px); }
</style>
