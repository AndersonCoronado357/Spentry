<script setup lang="ts">
// Hoja modal. En celular sube desde abajo (curva tipo iOS); en escritorio es un
// diálogo centrado que aparece desde 0.96. Solo se cierra con su botón de
// cerrar: ni tocando fuera, ni con Escape, ni arrastrando.
interface Props {
  open: boolean
  label?: string
  instant?: boolean   // abierta con teclado: sin animación de entrada
  wide?: boolean
}
defineProps<Props>()
</script>

<template>
  <Teleport to="body">
    <Transition name="scrim">
      <div v-if="open" class="sheet-scrim" :class="{ instant }" />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="open"
        class="sheet"
        :class="{ instant, wide }"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
