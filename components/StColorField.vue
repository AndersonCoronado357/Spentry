<script setup lang="ts">
// Campo de color: colores rápidos + una muestra propia que, como el selector
// nativo, abre una ventanita flotante con el selector completo (área, tono y hex).
import { PALETA } from '~/composables/useDatos'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

const abierto = ref(false)
const btnRef = ref<HTMLElement | null>(null)
const esPropio = computed(() => !PALETA.includes(props.modelValue.toUpperCase()))
const valor = computed({ get: () => props.modelValue, set: (v: string) => emit('update:modelValue', v) })
</script>

<template>
  <div class="cfield">
    <button
      v-for="c in PALETA"
      :key="c"
      type="button"
      :class="['cfield-sw', modelValue.toUpperCase() === c ? 'on' : '']"
      :style="{ background: c }"
      :aria-label="`Usar ${c}`"
      @click="valor = c"
    />
    <button
      ref="btnRef"
      type="button"
      :class="['cfield-custom', esPropio || abierto ? 'on' : '']"
      :style="{ '--sel': modelValue }"
      aria-label="Color personalizado"
      @click="abierto = !abierto"
    >
      <span class="cfield-ring" />
      <span class="cfield-dot" />
    </button>
  </div>
  <StPopover :anchor="btnRef" :open="abierto" :width="296" align="right" fit @close="abierto = false">
    <div class="cfield-pop">
      <StColorPicker v-model="valor" :presets="false" />
    </div>
  </StPopover>
</template>

<style scoped>
.cfield { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.cfield-sw, .cfield-custom {
  width: 30px; height: 30px; border-radius: 999px; border: 0; cursor: pointer; padding: 0; flex-shrink: 0;
  transition: transform .16s var(--ease-out), width .34s var(--ease-out);
}
.cfield-sw:active, .cfield-custom:active { transform: scale(.86); }
/* La elegida se estira en píldora: se distingue sin aros ni marcas encima. */
.cfield-sw.on { width: 48px; }
/* La propia, al estar elegida, deja ver más su color en el centro. */
.cfield-ring, .cfield-dot { transition: inset .3s var(--ease-out), background-color .2s ease; }
.cfield-custom.on .cfield-ring { inset: 3px; }
.cfield-custom.on .cfield-dot { inset: 5px; }
/* La muestra propia: aro de tonos con el color elegido al centro. */
.cfield-custom { position: relative; background: conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00); }
.cfield-ring { position: absolute; inset: 4px; border-radius: 999px; background: var(--bg); }
.cfield-dot { position: absolute; inset: 7px; border-radius: 999px; background: var(--sel); transition: background-color .2s ease; }
.cfield-pop { padding: 10px; }
</style>
