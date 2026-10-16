<script setup lang="ts">
interface Props {
  name: string
  on?: boolean
  size?: number
  ariaLabel?: string
  small?: boolean
  bare?: boolean
}
withDefaults(defineProps<Props>(), { on: false, size: 20, small: false, bare: false })
</script>

<template>
  <button
    type="button"
    :class="['iconbtn', on ? 'on' : '', small ? 'sm' : '', bare ? 'bare' : '']"
    :aria-label="ariaLabel"
    :title="ariaLabel"
  >
    <StIcon :name="name" :size="size" />
  </button>
</template>
