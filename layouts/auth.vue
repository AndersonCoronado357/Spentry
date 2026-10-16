<script setup lang="ts">
// Shell de acceso: pantalla completa, marca arriba.
</script>

<template>
  <div class="st-root">
    <div class="login-bg">
      <NuxtLink to="/login" class="login-brand" aria-label="Spentry">
        <StBrandmark :size="22" print />
      </NuxtLink>
      <slot />
    </div>
  </div>
</template>
