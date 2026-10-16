<script setup lang="ts">
interface Opcion {
  value: string | number
  label: string
  hint?: string
  dot?: string
}
interface Props {
  modelValue: string | number
  options: Opcion[]
  label?: string
  placeholder?: string
}
const props = withDefaults(defineProps<Props>(), { placeholder: 'Seleccionar' })
const emit = defineEmits<{ 'update:modelValue': [v: string | number] }>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const sel = computed(() => props.options.find(o => o.value === props.modelValue))

function pick(v: string | number) {
  emit('update:modelValue', v)
  open.value = false
}
</script>

<template>
  <label class="col" style="min-width: 0;">
    <span v-if="label" class="field-label">{{ label }}</span>
    <button
      type="button"
      ref="triggerRef"
      :class="['select-trigger', open ? 'open' : '']"
      @click="open = !open"
    >
      <span
        :class="sel ? '' : 'ph'"
        style="flex: 1; min-width: 0; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
      >
        {{ sel ? sel.label : placeholder }}
      </span>
      <StIcon name="chevronDown" :size="16" class="chev" />
    </button>
    <StPopover :anchor="triggerRef" :open="open" @close="open = false">
      <div
        v-for="o in options"
        :key="o.value"
        :class="['opt', o.value === modelValue ? 'sel' : '']"
        @click="pick(o.value)"
      >
        <span style="display: flex; align-items: center; gap: 9px;">
          <span v-if="o.dot" :style="{ width: '8px', height: '8px', borderRadius: '999px', background: o.dot }" />
          {{ o.label }}<span v-if="o.hint" class="faint" style="font-size: .82em">{{ o.hint }}</span>
        </span>
        <StIcon v-if="o.value === modelValue" name="check" :size="16" class="ck" />
      </div>
    </StPopover>
  </label>
</template>
