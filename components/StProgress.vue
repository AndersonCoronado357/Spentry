<script setup lang="ts">
import { trasPintar } from '~/composables/useTema'
// Barra de proporción. Se revela con clip-path (el extremo redondeado no se
// deforma, como pasaría con scaleX) y crece desde cero al montar.
interface Props { pct: number; color?: string }
const props = withDefaults(defineProps<Props>(), { color: 'var(--accent)' })
const listo = ref(false)
onMounted(() => trasPintar(() => { listo.value = true }))
const resto = computed(() => 100 - Math.min(100, Math.max(0, (listo.value ? props.pct : 0) * 100)))
</script>

<template>
  <div class="bar"><i :style="{ clipPath: `inset(0 ${resto}% 0 0 round 99px)`, background: color }" /></div>
</template>
