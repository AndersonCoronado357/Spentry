<script setup lang="ts">
// El ojito aparece SOLO cuando hay texto.

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  autocomplete?: string
}
const props = defineProps<Props>()
defineEmits<{ 'update:modelValue': [v: string] }>()

const show = ref(false)
const tieneTexto = computed(() => (props.modelValue ?? '').length > 0)
</script>

<template>
  <label class="col" style="min-width: 0;">
    <span v-if="label" class="field-label">{{ label }}</span>
    <span class="input-wrap">
      <span class="input-icon l">
        <StIcon name="lock" :size="18" />
      </span>
      <input
        :type="show ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        class="input has-icon-l has-icon-r"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <button
        type="button"
        :tabindex="tieneTexto ? 0 : -1"
        :aria-label="show ? 'Ocultar' : 'Mostrar'"
        class="input-icon r btn-icon reveal-eye"
        :class="tieneTexto ? 'show' : ''"
        @click="show = !show"
      >
        <StIcon :name="show ? 'eyeOff' : 'eye'" :size="18" />
      </button>
    </span>
  </label>
</template>
