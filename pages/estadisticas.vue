<script setup lang="ts">
import {
  hoy, inMonth, total, byCategory, dailySeries, lastMonths, formatMoney, formatShort,
  MESES, DIAS_COR, chartColor, valueIn, catPorId, sameDay,
} from '~/composables/useDatos'

useHead({ title: 'Estadísticas · Spentry' })

const { gastos, moneda } = useDatos()
const { tema } = useTema()
const { verRecibo } = useDetalle()
// En celular el mes va junto al título, abreviado ("Oct 2026").
const movil = useMediaQuery('(max-width: 899px)')

const y = ref(hoy().getFullYear())
const m = ref(hoy().getMonth())
const esActual = computed(() => y.value === hoy().getFullYear() && m.value === hoy().getMonth())

const delMes = computed(() => inMonth(gastos.value, y.value, m.value))
const totalMes = computed(() => total(delMes.value, moneda.value))
// Comparación justa: en el mes en curso se compara contra los mismos días del
// mes anterior (1 al día de hoy), no contra el mes anterior completo.
const prev = computed(() => {
  const d = new Date(y.value, m.value - 1, 1)
  const lista = inMonth(gastos.value, d.getFullYear(), d.getMonth())
  const tope = esActual.value ? hoy().getDate() : 31
  return total(lista.filter(g => g.date.getDate() <= tope), moneda.value)
})
const delta = computed(() => (prev.value ? (totalMes.value - prev.value) / prev.value : null))
// Días transcurridos del mes (si es el actual) para un promedio diario honesto.
const diasCont = computed(() => (esActual.value ? hoy().getDate() : new Date(y.value, m.value + 1, 0).getDate()))
const promedio = computed(() => totalMes.value / diasCont.value)
const mayor = computed(() =>
  delMes.value.reduce<typeof delMes.value[number] | null>((a, b) => (!a || valueIn(b, moneda.value) > valueIn(a, moneda.value) ? b : a), null),
)

// Día a día
const serie = computed(() => dailySeries(gastos.value, y.value, m.value, moneda.value))
const diaSel = ref<string | number | null>(null)
watch([y, m], () => { diaSel.value = null; catSel.value = null })
const serieData = computed(() =>
  serie.value.map(d => ({
    key: d.d,
    label: String(d.d),
    tip: `${DIAS_COR[d.date.getDay()]} ${d.d}`,
    v: d.v,
    hl: esActual.value && sameDay(d.date, hoy()),
  })),
)
const diaMasCaro = computed(() => serie.value.reduce((a, b) => (b.v > a.v ? b : a), serie.value[0]!))

// Por categoría
const cats = computed(() => byCategory(delMes.value, moneda.value))
const catSel = ref<string | null>(null)
const segs = computed(() => cats.value.map(c => ({ id: c.id, value: c.value, color: chartColor(c.color, tema.value), label: c.label })))
const catActiva = computed(() => cats.value.find(c => c.id === catSel.value))

// Últimos 6 meses
const meses = computed(() => lastMonths(gastos.value, 6, moneda.value, hoy().getFullYear(), hoy().getMonth()))
const mesesData = computed(() =>
  meses.value.map(d => ({ key: `${d.y}-${d.m}`, label: d.label, tip: `${MESES[d.m]} ${d.y}`, v: d.v, hl: d.y === y.value && d.m === m.value })),
)
const promMeses = computed(() => {
  const con = meses.value.filter(d => d.v > 0)
  return con.length ? con.reduce((s, d) => s + d.v, 0) / con.length : 0
})
function irAMes(key: string | number) {
  const [yy, mm] = String(key).split('-').map(Number)
  cambiarMes(yy!, mm!)
}
// Al cambiar de mes, el contenido entra desde el lado hacia el que se navega.
const dirMes = ref<'next' | 'prev'>('next')
function cambiarMes(ny: number, nm: number) {
  dirMes.value = ny * 12 + nm > y.value * 12 + m.value ? 'next' : 'prev'
  y.value = ny; m.value = nm
}
</script>

<template>
  <div class="screen fill stats">
    <header class="page-head">
      <div class="col grow" style="min-width: 0">
        <span class="eyebrow">Tu dinero</span>
        <h1 class="page-title">Estadísticas</h1>
      </div>
      <StMonthSwitch :y="y" :m="m" :corto="movil" @change="cambiarMes" />
    </header>

    <Transition :name="`mes-${dirMes}`" mode="out-in">
    <div :key="`${y}-${m}`" class="stats-grid">
      <!-- Resumen del mes -->
      <section class="card stats-hero">
        <div class="col" style="gap: 10px; min-width: 0">
          <span class="muted" style="font-size: .92rem; font-weight: 700">Gastaste en {{ MESES[m] }}</span>
          <span class="hero-num"><StOdometer :value="totalMes" :code="moneda" /></span>
          <span v-if="delta !== null" :class="['delta', delta > 0 ? 'up' : 'down']">
            <StIcon :name="delta > 0 ? 'arrowUp' : 'arrowDown'" :size="14" stroke="2.4" />
            {{ Math.abs(Math.round(delta * 100)) }}%
            <span class="faint">vs. {{ esActual ? `1–${hoy().getDate()} de ${MESES[(m + 11) % 12]}` : MESES[(m + 11) % 12] }} ({{ formatShort(prev, moneda) }})</span>
          </span>
          <span v-else class="faint" style="font-size: .86rem">Sin datos del mes anterior para comparar</span>
        </div>
        <div class="stats-meta">
          <div><span class="faint">Promedio diario</span><b class="num">{{ formatMoney(promedio, moneda) }}</b></div>
          <div><span class="faint">Recibos</span><b class="num">{{ delMes.length }}</b></div>
          <div>
            <span class="faint">Día más caro</span>
            <b class="num">{{ diaMasCaro && diaMasCaro.v ? `${DIAS_COR[diaMasCaro.date.getDay()]} ${diaMasCaro.d} · ${formatShort(diaMasCaro.v, moneda)}` : '—' }}</b>
          </div>
          <button v-if="mayor" type="button" class="meta-pill" @click="verRecibo(mayor.id)">
            <StCatIcon :icon="catPorId(mayor.category).icon" :color="catPorId(mayor.category).color" :size="40" />
            <span class="meta-pill-txt">
              <span class="faint">Gasto más alto · {{ mayor.note || catPorId(mayor.category).label }}</span>
              <b class="num">{{ formatMoney(mayor.amount, mayor.currency) }}</b>
            </span>
            <span class="meta-pill-go"><StIcon name="receipt" :size="16" /></span>
          </button>
          <div v-else><span class="faint">Gasto más alto</span><b>—</b></div>
        </div>
      </section>

      <!-- Día a día -->
      <section class="card chart-card daily">
        <div class="spread" style="gap: 12px">
          <span class="panel-title">Día a día</span>
          <span class="faint" style="font-size: .82rem">Línea: promedio diario</span>
        </div>
        <StBarChart
          fill
          :data="serieData"
          :format="v => formatMoney(v, moneda)"
          :avg="promedio || null"
          :format-short="v => formatShort(v, moneda)"
          :selected="diaSel"
          :label-every="5"
          @pick="k => diaSel = diaSel === k ? null : k"
        />
      </section>

      <!-- Por categoría -->
      <section class="card chart-card cat-break">
        <span class="panel-title">Por categoría</span>
        <div v-if="cats.length" class="cat-break-body">
          <StDonut
            :segs="segs"
            :selected="catSel"
            :center="catActiva ? formatMoney(catActiva.value, moneda) : formatShort(totalMes, moneda)"
            :caption="catActiva ? catActiva.label : 'en total'"
            @pick="id => catSel = id"
          />
          <StScroll class="legend">
            <button
              v-for="(c, i) in cats"
              :key="c.id"
              type="button"
              :class="['legend-row', 'stagger', catSel === c.id ? 'on' : '', catSel && catSel !== c.id ? 'dim' : '']"
              :style="{ '--i': i }"
              @click="catSel = catSel === c.id ? null : c.id"
            >
              <i class="legend-sw" :style="{ background: chartColor(c.color, tema) }" />
              <span class="grow ellipsis" style="text-align: left">{{ c.label }}</span>
              <span class="num legend-pct">{{ Math.round(totalMes ? (c.value / totalMes) * 100 : 0) }}%</span>
              <span class="num legend-amt">{{ formatMoney(c.value, moneda) }}</span>
            </button>
          </StScroll>
        </div>
        <div v-else class="empty fill-empty">
          <StIcon name="chart" :size="30" style="color: var(--text3)" />
          <span class="muted" style="font-size: .9rem">Sin gastos en {{ MESES[m] }}</span>
        </div>
      </section>

      <!-- Últimos 6 meses -->
      <section class="card chart-card months">
        <div class="spread" style="gap: 12px">
          <span class="panel-title">Últimos 6 meses</span>
          <span class="faint" style="font-size: .82rem">Toca un mes para verlo</span>
        </div>
        <StBarChart
          fill
          :data="mesesData"
          :format="v => formatMoney(v, moneda)"
          :avg="promMeses || null"
          :format-short="v => formatShort(v, moneda)"
          @pick="irAMes"
        />
      </section>
    </div>
    </Transition>
  </div>
</template>
