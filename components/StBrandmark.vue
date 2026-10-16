<script setup lang="ts">
interface Props { size?: number; print?: boolean }
const props = withDefaults(defineProps<Props>(), { size: 24, print: false })
const fontSize = computed(() => `${props.size * 0.9}px`)
</script>

<template>
  <span class="row" style="gap: 8px; align-items: center">
    <span style="color: var(--accent); display: flex">
      <StLogo :size="size + 4" :print="print" />
    </span>
    <span
      class="st-title"
      :style="{ fontWeight: 700, fontSize, letterSpacing: '-.03em', color: 'var(--text)' }"
    >Spentry</span>
  </span>
</template>
