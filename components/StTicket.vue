<script setup lang="ts">
// El recibo impreso de un gasto: papel con borde dentado, tipografía de
// impresora térmica y un código de barras derivado del folio.
import type { Gasto } from '~/types/gasto'
import { catPorId, formatMoney, folioStr, fmtTime, valueIn, isoD } from '~/composables/useDatos'

interface Props { gasto: Gasto; moneda: string }
const props = defineProps<Props>()

const cat = computed(() => catPorId(props.gasto.category))
const fecha = computed(() => {
  const d = props.gasto.date
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
})
const convertido = computed(() => props.gasto.currency !== props.moneda)

// Barras deterministas a partir del folio (siempre el mismo código para el mismo recibo).
const barras = computed(() => {
  const out: { x: number; w: number }[] = []
  let x = 0
  let s = (props.gasto.folio || 1) * 9301 + 49297
  for (let i = 0; i < 34; i++) {
    s = (s * 9301 + 49297) % 233280
    const w = 1 + (s % 3)
    out.push({ x, w })
    x += w + 1 + ((s >> 3) % 2)
  }
  return { bars: out, width: x }
})
const codigo = computed(() => `${folioStr(props.gasto.folio)}-${(isoD(props.gasto.date) ?? '').replace(/-/g, '')}`)
</script>

<template>
  <div class="ticket">
    <div class="tk-head">
      <span class="tk-brand"><StLogo :size="18" /><span>SPENTRY</span></span>
      <span class="tk-sub">Recibo de gasto</span>
    </div>

    <div class="tk-rule" />

    <div class="tk-line">
      <span>N.º {{ folioStr(gasto.folio) }}</span>
      <span>{{ fecha }}</span>
    </div>
    <div class="tk-line tk-mute">
      <span>Registrado</span>
      <span>{{ fmtTime(gasto.createdAt) }}</span>
    </div>

    <div class="tk-rule" />

    <div class="tk-cat">
      <StCatIcon :icon="cat.icon" :color="cat.color" :size="28" />
      <span>{{ cat.label.toUpperCase() }}</span>
    </div>
    <p v-if="gasto.note" class="tk-note">{{ gasto.note }}</p>

    <div class="tk-rule" />

    <div class="tk-total">
      <span>TOTAL</span>
      <span class="num">{{ formatMoney(gasto.amount, gasto.currency) }}</span>
    </div>
    <div v-if="convertido" class="tk-line tk-mute">
      <span>En {{ moneda }}</span>
      <span class="num">≈ {{ formatMoney(valueIn(gasto, moneda), moneda) }}</span>
    </div>

    <div class="tk-rule" />

    <svg class="tk-barcode" :viewBox="`0 0 ${barras.width} 30`" preserveAspectRatio="none" aria-hidden="true">
      <rect v-for="(b, i) in barras.bars" :key="i" :x="b.x" y="0" :width="b.w" height="30" fill="currentColor" />
    </svg>
    <div class="tk-code">{{ codigo }}</div>
    <div class="tk-thanks"><StIcon name="sparkle" :size="11" stroke="2" />Gracias por anotar<StIcon name="sparkle" :size="11" stroke="2" /></div>
  </div>
</template>
