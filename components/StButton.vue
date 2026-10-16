<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'ghost' | 'quiet' | 'danger'
  size?: 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  block?: boolean
}
withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
  block: false,
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="['btn', `btn-${variant}`, size === 'lg' ? 'btn-lg' : '', block ? 'btn-block' : '']"
  >
    <slot />
  </button>
</template>
