<script setup lang="ts">
// Popover en portal: nunca queda cortado por overflow. Se posiciona contra el
// viewport y crece desde su disparador (transform-origin según el lado).
// Cierra con toque fuera o Escape (sin cerrar la hoja que lo contiene).

interface Props {
  anchor: HTMLElement | null
  open: boolean
  align?: 'left' | 'right'
  width?: number
  fit?: boolean   // sin alto máximo ni scroll interno (calendario, selector de color)
}
const props = withDefaults(defineProps<Props>(), { align: 'left' })
const emit = defineEmits<{ close: [] }>()

const popRef = ref<HTMLElement | null>(null)
const pos = ref<{ left: number; top: number; width: number; origin: string } | null>(null)

function place() {
  const a = props.anchor
  if (!a || !props.open) return
  const r = a.getBoundingClientRect()
  const w = Math.min(props.width ?? r.width, window.innerWidth - 16)
  const vh = window.innerHeight
  const vw = window.innerWidth
  const ph = popRef.value?.offsetHeight ?? 320
  const below = vh - r.bottom
  const openUp = below < ph + 12 && r.top > below
  let left = props.align === 'right' ? r.right - w : r.left
  left = Math.max(8, Math.min(left, vw - w - 8))
  const top = openUp ? Math.max(8, r.top - ph - 6) : r.bottom + 6
  const ox = Math.min(Math.max(r.left + r.width / 2 - left, 0), w)
  pos.value = { left, top, width: w, origin: `${ox}px ${openUp ? '100%' : '0%'}` }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    e.stopImmediatePropagation()
    emit('close')
  }
}
function onDown(e: PointerEvent) {
  const t = e.target as Node
  if (props.open && popRef.value && !popRef.value.contains(t) && props.anchor && !props.anchor.contains(t)) emit('close')
}

watch(() => props.open, async (open) => {
  if (open) { await nextTick(); place() } else pos.value = null
})

onMounted(() => {
  window.addEventListener('scroll', place, true)
  window.addEventListener('resize', place)
  window.addEventListener('keydown', onKey, true)
  document.addEventListener('pointerdown', onDown, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', place, true)
  window.removeEventListener('resize', place)
  window.removeEventListener('keydown', onKey, true)
  document.removeEventListener('pointerdown', onDown, true)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="popRef"
      :class="['popover', fit ? 'fit' : '']"
      :style="pos
        ? { left: pos.left + 'px', top: pos.top + 'px', width: pos.width + 'px', '--origin': pos.origin }
        : { left: '0px', top: '0px', width: (width ?? 240) + 'px', visibility: 'hidden' }"
    >
      <slot />
    </div>
  </Teleport>
</template>
