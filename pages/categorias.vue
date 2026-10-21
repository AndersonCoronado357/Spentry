<script setup lang="ts">
import type { Categoria } from '~/types/gasto'
import { hoy, inPeriodo, periodoDe, total, formatMoney } from '~/composables/useDatos'

useHead({ title: 'Categorías · Spentry' })

const { categorias, gastos, moneda } = useDatos()
const { abrir } = useRegistro()

const editando = ref<Categoria | null>(null)
const abierto = ref(false)
function nueva() { editando.value = null; abierto.value = true }
function editar(c: Categoria) { editando.value = c; abierto.value = true }

const ahora = hoy()
// Mientras la vista entra, los iconos se dibujan (ver .cats-entrando en CSS).
const entrando = ref(true)
onMounted(() => setTimeout(() => { entrando.value = false }, 1700))
const delMes = computed(() => inPeriodo(gastos.value, periodoDe(ahora)))
const totalMes = computed(() => total(delMes.value, moneda.value))
const stats = computed(() => {
  const m: Record<string, { mes: number; count: number }> = {}
  for (const c of categorias.value) m[c.id] = { mes: 0, count: 0 }
  for (const g of gastos.value) if (m[g.category]) m[g.category]!.count++
  for (const g of delMes.value) if (m[g.category]) m[g.category]!.mes += total([g], moneda.value)
  return m
})
</script>

<template>
  <div :class="['screen', 'fill', 'cats-screen', entrando ? 'cats-entrando' : '']">
    <header class="page-head">
      <div class="col grow" style="min-width: 0">
        <span class="eyebrow">Para ordenar tus gastos</span>
        <h1 class="page-title">Categorías</h1>
      </div>
      <button type="button" class="btn btn-primary" @click="nueva">
        <StIcon name="plus" :size="18" /><span>Nueva</span>
      </button>
    </header>

    <StScroll class="cat-scroll" fade="var(--bg)">
      <div class="cat-grid">
        <article
          v-for="(c, i) in categorias"
          :key="c.id"
          class="cat-card"
          :style="{ '--c': c.color, '--i': i }"
        >
          <button type="button" class="cat-card-main" @click="editar(c)">
            <StCatIcon :icon="c.icon" :color="c.color" :size="48" />
            <span class="col grow" style="gap: 3px; min-width: 0; align-items: flex-start">
              <span class="cat-card-name ellipsis">{{ c.label }}</span>
              <span class="faint" style="font-size: .84rem; font-weight: 600">
                {{ stats[c.id]?.count ?? 0 }} {{ stats[c.id]?.count === 1 ? 'recibo' : 'recibos' }}
              </span>
            </span>
            <span class="col" style="align-items: flex-end; gap: 3px; flex-shrink: 0">
              <span class="num cat-card-amt">{{ formatMoney(stats[c.id]?.mes ?? 0, moneda) }}</span>
              <span class="faint" style="font-size: .76rem; font-weight: 600">esta quincena</span>
            </span>
          </button>
          <div class="cat-card-foot">
            <StProgress :pct="totalMes ? (stats[c.id]?.mes ?? 0) / totalMes : 0" :color="c.color" />
            <button type="button" class="cat-add" :aria-label="`Registrar gasto en ${c.label}`" @click="abrir({ categoria: c.id })">
              <StIcon name="plus" :size="16" />
            </button>
          </div>
        </article>

        <button type="button" class="cat-card cat-new" @click="nueva">
          <span class="cat-new-ic"><StIcon name="plus" :size="22" /></span>
          <span style="font-weight: 800">Nueva categoría</span>
          <span class="faint" style="font-size: .82rem; font-weight: 600">Nombre, icono y color</span>
        </button>
      </div>
    </StScroll>

    <StCategoriaForm :open="abierto" :cat="editando" @close="abierto = false" />
  </div>
</template>
