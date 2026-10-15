<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } }>()
function volver() { return clearError({ redirect: '/' }) }
</script>

<template>
  <div class="st-root">
    <main style="height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--bg); color: var(--text)">
      <div style="max-width: 360px; text-align: center; display: flex; flex-direction: column; align-items: center">
        <span style="color: var(--accent)"><StLogo :size="56" print /></span>
        <p class="eyebrow" style="margin: 18px 0 0">Error {{ props.error.statusCode }}</p>
        <h1 class="st-title" style="font-weight: 600; font-size: clamp(1.8rem, 4vw, 2.4rem); letter-spacing: -.02em; margin: 8px 0 12px">
          Este recibo salió en blanco.
        </h1>
        <p class="muted" style="font-size: .95rem; line-height: 1.5; margin: 0">{{ props.error.message }}</p>
        <button class="btn btn-primary" style="margin-top: 24px" @click="volver">Volver al inicio</button>
      </div>
    </main>
  </div>
</template>
