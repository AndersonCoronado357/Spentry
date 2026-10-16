<script setup lang="ts">
interface Props {
  modelValue: string | number
  label?: string
  icon?: string
  iconRight?: string
  placeholder?: string
  type?: string
  as?: 'input' | 'textarea'
  autocomplete?: string
  autofocus?: boolean
  inputmode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel' | 'search'
  maxlength?: number
  enterkeyhint?: 'done' | 'go' | 'next' | 'search' | 'send' | 'enter'
}
withDefaults(defineProps<Props>(), { type: 'text', as: 'input' })
defineEmits<{ 'update:modelValue': [v: string]; enter: [] }>()
</script>

<template>
  <label class="col" style="min-width: 0">
    <span v-if="label" class="field-label">{{ label }}</span>
    <span class="input-wrap">
      <span v-if="icon" class="input-icon l"><StIcon :name="icon" :size="18" /></span>
      <textarea
        v-if="as === 'textarea'"
        :value="modelValue"
        :placeholder="placeholder"
        :maxlength="maxlength"
        class="input area"
        :class="[icon ? 'has-icon-l' : '', iconRight ? 'has-icon-r' : '']"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
      <input
        v-else
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        :inputmode="inputmode"
        :maxlength="maxlength"
        :enterkeyhint="enterkeyhint"
        class="input"
        :class="[icon ? 'has-icon-l' : '', iconRight ? 'has-icon-r' : '']"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="$emit('enter')"
      >
      <span v-if="iconRight" class="input-icon r"><StIcon :name="iconRight" :size="18" /></span>
    </span>
  </label>
</template>
