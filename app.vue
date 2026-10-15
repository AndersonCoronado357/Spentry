<script setup lang="ts">
const { inicializar } = useTema()
if (typeof window !== 'undefined') inicializar()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
