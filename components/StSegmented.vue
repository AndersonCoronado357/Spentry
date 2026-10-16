<script setup lang="ts">
// Control segmentado: la pastilla activa se desliza (transform) hasta la opción.
interface Opcion { value: string | number; label: string; icon?: string }
interface Props { modelValue: string | number; options: Opcion[]; ariaLabel?: string; small?: boolean }
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [v: string | number]; pick: [v: string | number, e: MouseEvent] }>()

const wrapRef = ref<HTMLElement | null>(null)
const thumb = ref<{ x: number; w: number } | null>(null)
const idx = computed(() => Math.max(0, props.options.findIndex(o => o.value === props.modelValue)))

function recompute() {
  const b = wrapRef.value?.querySelectorAll<HTMLElement>('.seg-btn')[idx.value]
  if (b) thumb.value = { x: b.offsetLeft, w: b.offsetWidth }
}
watch([idx, () => props.options.length], async () => { await nextTick(); recompute() })
let ro: ResizeObserver | null = null
onMounted(async () => {
  await nextTick()
  recompute()
  ro = new ResizeObserver(recompute)
  if (wrapRef.value) ro.observe(wrapRef.value)
})
onBeforeUnmount(() => ro?.disconnect())

function pick(o: Opcion, e: MouseEvent) {
  emit('update:modelValue', o.value)
  emit('pick', o.value, e)
}
</script>

<template>
  <div ref="wrapRef" class="seg" role="radiogroup" :aria-label="ariaLabel" :class="small ? 'seg-sm' : ''">
    <span
      v-if="thumb"
      class="seg-thumb"
      :style="{ width: thumb.w + 'px', transform: `translateX(${thumb.x}px)` }"
    />
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="modelValue === o.value"
      :class="['seg-btn', o.value === modelValue ? 'on' : '']"
      @click="pick(o, $event)"
    >
      <StIcon v-if="o.icon" :name="o.icon" :size="16" />{{ o.label }}
    </button>
  </div>
</template>

<style scoped>
.seg-sm .seg-btn { padding: 7px 12px; font-size: .82rem; }
</style>
