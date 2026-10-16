<script setup lang="ts">
interface Props { modelValue: boolean; disabled?: boolean }
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()
function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    :class="['switch', modelValue ? 'on' : '', disabled ? 'is-disabled' : '']"
    @click="toggle"
  >
    <i />
  </button>
</template>
