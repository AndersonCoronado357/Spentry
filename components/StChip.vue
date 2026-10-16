<script setup lang="ts">
interface Props { on?: boolean }
withDefaults(defineProps<Props>(), { on: false })
</script>

<template>
  <button type="button" :class="['chip', on ? 'on' : '']">
    <slot />
  </button>
</template>
