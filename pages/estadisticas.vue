<script setup lang="ts">
import {
  hoy, inPeriodo, total, byCategory, dailySeriesPeriodo, lastPeriodos, formatMoney, formatShort,
  MESES_COR, DIAS_COR, chartColor, valueIn, catPorId, sameDay,
  periodoDe, moverPeriodo, mismoPeriodo, ordenPeriodo, rangoDe, rangoTexto, etiquetaPeriodo, sinFijos, type Periodo,
} from '~/composables/useDatos'

useHead({ title: 'Estadísticas · Spentry' })

const { gastos, moneda } = useDatos()
const { tema } = useTema()
const { verRecibo } = useDetalle()
// En celular la quincena va junto al título, abreviada ("16–31 oct").
const movil = useMediaQuery('(max-width: 899px)')

const per = ref<Periodo>(periodoDe(hoy()))
const esActual = computed(() => mismoPeriodo(per.value, periodoDe(hoy())))

const delMes = computed(() => inPeriodo(gastos.value, per.value))
const totalMes = computed(() => total(delMes.value, moneda.value))
// Comparación justa: en la quincena en curso se compara contra los mismos días
// de la quincena anterior (sus primeros N días), no contra la quincena completa.
const diasCont = computed(() => {
  const { ini, fin } = rangoDe(per.value)
  return esActual.value ? hoy().getDate() - ini + 1 : fin - ini + 1
})
const anterior = computed(() => moverPeriodo(per.value, -1))
const tramoPrev = computed(() => {
  const { ini, fin } = rangoDe(anterior.value)
  return { ini, fin: esActual.value ? Math.min(fin, ini + diasCont.value - 1) : fin }
})
const prev = computed(() => {
  const { ini, fin } = tramoPrev.value
  return total(inPeriodo(gastos.value, anterior.value).filter(g => g.date.getDate() >= ini && g.date.getDate() <= fin), moneda.value)
})
const delta = computed(() => (prev.value ? (totalMes.value - prev.value) / prev.value : null))
// Los fijos cuentan en el total, las categorías y las quincenas; lo que mide días
// (promedio diario, día a día, día más caro, gasto más alto) es lo del día a día:
// un fijo es de la quincena, no de un día.
const diarios = computed(() => sinFijos(delMes.value))
const totalFijos = computed(() => totalMes.value - total(diarios.value, moneda.value))
// Días transcurridos de la quincena (si es la actual) para un promedio diario honesto.
const promedio = computed(() => total(diarios.value, moneda.value) / diasCont.value)
const mayor = computed(() =>
  diarios.value.reduce<typeof delMes.value[number] | null>((a, b) => (!a || valueIn(b, moneda.value) > valueIn(a, moneda.value) ? b : a), null),
)

// Día a día
const serie = computed(() => dailySeriesPeriodo(sinFijos(gastos.value), per.value, moneda.value))
const diaSel = ref<string | number | null>(null)
watch(per, () => { diaSel.value = null; catSel.value = null })
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

// Últimas 6 quincenas
const meses = computed(() => lastPeriodos(gastos.value, 6, moneda.value, periodoDe(hoy())))
const mesesData = computed(() =>
  meses.value.map(d => ({ key: `${d.y}-${d.m}-${d.q}`, label: d.label, tip: `${etiquetaPeriodo(d)} ${d.y}`, v: d.v, hl: mismoPeriodo(d, per.value) })),
)
const promMeses = computed(() => {
  const con = meses.value.filter(d => d.v > 0)
  return con.length ? con.reduce((s, d) => s + d.v, 0) / con.length : 0
})
function irAMes(key: string | number) {
  const [yy, mm, qq] = String(key).split('-').map(Number)
  cambiarMes({ y: yy!, m: mm!, q: qq! })
}
// Al cambiar de quincena, el contenido entra desde el lado hacia el que se navega.
const dirMes = ref<'next' | 'prev'>('next')
function cambiarMes(p: Periodo) {
  dirMes.value = ordenPeriodo(p) > ordenPeriodo(per.value) ? 'next' : 'prev'
  per.value = p
}
</script>

<template>
  <div class="screen fill stats">
    <header class="page-head">
      <div class="col grow" style="min-width: 0">
        <span class="eyebrow">Tu dinero</span>
        <h1 class="page-title">Estadísticas</h1>
      </div>
      <StMonthSwitch :y="per.y" :m="per.m" :q="per.q" :corto="movil" @change="cambiarMes" />
    </header>

    <Transition :name="`mes-${dirMes}`" mode="out-in">
    <div :key="ordenPeriodo(per)" class="stats-grid">
      <!-- Resumen de la quincena -->
      <section class="card stats-hero">
        <div class="col" style="gap: 10px; min-width: 0">
          <span class="muted" style="font-size: .92rem; font-weight: 700">Gastaste {{ rangoTexto(per) }}</span>
          <span class="hero-num"><StOdometer :value="totalMes" :code="moneda" /></span>
          <span v-if="delta !== null" :class="['delta', delta > 0 ? 'up' : 'down']">
            <StIcon :name="delta > 0 ? 'arrowUp' : 'arrowDown'" :size="14" stroke="2.4" />
            {{ Math.abs(Math.round(delta * 100)) }}%
            <span class="faint">vs. {{ tramoPrev.ini }}–{{ tramoPrev.fin }} de {{ MESES_COR[anterior.m] }} ({{ formatShort(prev, moneda) }})</span>
          </span>
          <span v-else class="faint" style="font-size: .86rem">Sin datos de la quincena anterior para comparar</span>
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
          <span class="faint" style="font-size: .82rem">{{ totalFijos ? 'Línea: promedio · sin fijos' : 'Línea: promedio diario' }}</span>
        </div>
        <StBarChart
          fill
          :data="serieData"
          :format="v => formatMoney(v, moneda)"
          :avg="promedio || null"
          :format-short="v => formatShort(v, moneda)"
          :selected="diaSel"
          :label-every="movil ? 2 : 1"
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
          <span class="muted" style="font-size: .9rem">Sin gastos {{ rangoTexto(per) }}</span>
        </div>
      </section>

      <!-- Últimas 6 quincenas -->
      <section class="card chart-card months">
        <div class="spread" style="gap: 12px">
          <span class="panel-title">Últimas 6 quincenas</span>
          <span class="faint" style="font-size: .82rem">Toca una para verla</span>
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
