<script setup lang="ts">
// Icono de categoría sobre su color suave, en círculo. El color viaja como --c;
// el del icono se calcula para que siempre se vea (--ci-l claro, --ci-d oscuro).
import { tintaIcono } from '~/composables/useDatos'
interface Props { icon: string; color: string; size?: number; radius?: number }
const props = withDefaults(defineProps<Props>(), { size: 40 })
const iconSize = computed(() => Math.round(props.size * 0.48))
const tinta = computed(() => ({ '--ci-l': tintaIcono(props.color, 'light'), '--ci-d': tintaIcono(props.color, 'dark') }))
</script>

<template>
  <span
    class="cat-tile"
    :style="{ '--c': color, ...tinta, width: size + 'px', height: size + 'px', borderRadius: radius != null ? radius + 'px' : '999px' }"
  >
    <StIcon :name="icon" :size="iconSize" />
  </span>
</template>
