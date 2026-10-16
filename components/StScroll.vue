<script setup lang="ts">
// Zona con scroll interno que avisa que hay más con un desvanecido en el borde
// hacia donde queda contenido (sin barra de scroll visible).
interface Props { fade?: string; tag?: string }
withDefaults(defineProps<Props>(), { fade: 'var(--s1)', tag: 'div' })

const el = ref<HTMLElement | null>(null)
const arriba = ref(true)
const abajo = ref(true)
let raf = 0

function medir() {
  raf = 0
  const e = el.value
  if (!e) return
  const max = e.scrollHeight - e.clientHeight
  arriba.value = e.scrollTop <= 2
  abajo.value = e.scrollTop >= max - 2
}
function onScroll() {
  if (!raf) raf = requestAnimationFrame(medir)
}
let ro: ResizeObserver | null = null
let mo: MutationObserver | null = null
onMounted(() => {
  medir()
  ro = new ResizeObserver(() => medir())
  if (el.value) {
    ro.observe(el.value)
    mo = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(medir) })
    mo.observe(el.value, { childList: true, subtree: true })
  }
})
onBeforeUnmount(() => { ro?.disconnect(); mo?.disconnect(); if (raf) cancelAnimationFrame(raf) })
defineExpose({ el })
</script>

<template>
  <div class="sx" :style="{ '--fade': fade }">
    <component :is="tag" ref="el" class="sx-in" @scroll.passive="onScroll"><slot /></component>
    <i :class="['sx-fade', 'top', arriba ? '' : 'on']" aria-hidden="true" />
    <i :class="['sx-fade', 'bot', abajo ? '' : 'on']" aria-hidden="true" />
  </div>
</template>
