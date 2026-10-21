<script setup lang="ts">
import {
  hoy, inPeriodo, onDay, total, byCategory, lastDays, formatMoney, formatShort,
  DIAS_COR, dayLabel, folioStr, sameDay, periodoDe, rangoDe, sinFijos,
} from '~/composables/useDatos'

useHead({ title: 'Inicio · Spentry' })

const { gastos, usuario, moneda, budget, categorias, borrar, restaurar } = useDatos()
const registrar = useRegistrar()
const { reg } = useRegistro()
const { verRecibo } = useDetalle()
const { mostrar } = useToast()
const { onEnter, onLeave } = useListaAnimada()

// Mientras la caja está abierta, el total y la lista se quedan quietos; al
// cerrarse, el total rueda y el recibo nuevo entra a la lista a la vista.
function congelado<T>(src: () => T) {
  const v = shallowRef(src())
  watch([src, () => reg.abierto], ([nv, abierto]) => { if (!abierto) v.value = nv as T })
  return v
}

const ahora = hoy()
// La caja se ve por quincena: del 1 al 15 y del 16 a fin de mes.
const per = periodoDe(ahora)
const { ini, fin } = rangoDe(per)

// Los fijos cuentan en el total, el presupuesto y las categorías de la quincena;
// lo que mide días (hoy, promedio, últimos 7 días, últimos recibos) es lo del día a día.
const diarios = computed(() => sinFijos(gastos.value))
const delMes = computed(() => inPeriodo(gastos.value, per))
const totalMes = computed(() => total(delMes.value, moneda.value))
const totalHoy = computed(() => total(onDay(diarios.value, ahora), moneda.value))
const promedio = computed(() => total(sinFijos(delMes.value), moneda.value) / (ahora.getDate() - ini + 1))
const recientes = computed(() =>
  [...diarios.value]
    .sort((a, b) => b.date.getTime() - a.date.getTime() || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30),
)
const cats = computed(() => byCategory(delMes.value, moneda.value))

const totalVista = congelado(() => totalMes.value)
const recientesVista = congelado(() => recientes.value)

const usoPct = computed(() => (budget.value ? totalMes.value / budget.value : 0))
const excedido = computed(() => budget.value > 0 && totalMes.value > budget.value)

const semana = computed(() => lastDays(diarios.value, 7, moneda.value, ahora))
const diaSel = ref<string | number | null>(null)
const semanaData = computed(() =>
  semana.value.map(d => ({
    key: d.date.toDateString(),
    label: DIAS_COR[d.date.getDay()]!.slice(0, 2),
    tip: dayLabel(d.date),
    v: d.v,
    hl: sameDay(d.date, ahora),
  })),
)
const semanaTotal = computed(() => semana.value.reduce((s, d) => s + d.v, 0))
const diaElegido = computed(() => semanaData.value.find(d => d.key === diaSel.value))

// Desvanecido de "Anotar rápido" solo del lado donde quedan más chips.
const chipsRef = ref<HTMLElement | null>(null)
const masIzq = ref(false)
const masDer = ref(false)
function bordesChips() {
  const e = chipsRef.value
  if (!e) return
  masIzq.value = e.scrollLeft > 2
  masDer.value = e.scrollLeft < e.scrollWidth - e.clientWidth - 2
}
let roChips: ResizeObserver | null = null
onMounted(() => {
  bordesChips()
  roChips = new ResizeObserver(bordesChips)
  if (chipsRef.value) roChips.observe(chipsRef.value)
})
onBeforeUnmount(() => roChips?.disconnect())
watch(() => categorias.value.length, () => nextTick(bordesChips))

const atajos = computed(() => {
  const uso: Record<string, number> = {}
  for (const g of gastos.value) uso[g.category] = (uso[g.category] ?? 0) + 1
  return [...categorias.value].sort((a, b) => (uso[b.id] ?? 0) - (uso[a.id] ?? 0) || a.sort - b.sort)
})

const hora = ahora.getHours()
const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
const nombre = computed(() => usuario.value.name.split(' ')[0])

function anular(id: string) {
  const g = borrar(id)
  if (!g) return
  mostrar({
    title: `Recibo N.º ${folioStr(g.folio)} anulado`,
    body: formatMoney(g.amount, g.currency),
    icon: 'trash',
    action: { label: 'Deshacer', run: () => restaurar(g) },
  })
}
</script>

<template>
  <div class="screen fill home">
    <header class="page-head">
      <div class="col grow" style="min-width: 0">
        <span class="eyebrow ellipsis">{{ saludo }}{{ nombre ? `, ${nombre}` : '' }}</span>
        <h1 class="page-title">Tu caja del {{ ini }} al {{ fin }}</h1>
      </div>
      <NuxtLink to="/ajustes" class="head-av only-mobile" aria-label="Ajustes y perfil">
        <img v-if="usuario.photo" :src="usuario.photo" alt="" />
        <template v-else>{{ usuario.name.charAt(0) }}</template>
      </NuxtLink>
    </header>

    <div class="home-grid">
      <!-- Total de la quincena -->
      <section class="card hero">
        <div class="hero-top">
          <span class="muted" style="font-size: .92rem; font-weight: 700">Gastado esta quincena</span>
          <span class="badge">{{ delMes.length }} {{ delMes.length === 1 ? 'recibo' : 'recibos' }}</span>
        </div>
        <div class="hero-num"><StOdometer :value="totalVista" :code="moneda" id="home-total" /></div>
        <div class="hero-stats">
          <div><span>Hoy</span><b class="num">{{ formatMoney(totalHoy, moneda) }}</b></div>
          <div><span>Promedio diario</span><b class="num">{{ formatMoney(promedio, moneda) }}</b></div>
          <div><span>Últimos 7 días</span><b class="num">{{ formatMoney(semanaTotal, moneda) }}</b></div>
        </div>
        <div v-if="budget > 0" :class="['hero-budget', excedido ? 'over' : '']">
          <StProgress :pct="Math.min(1, usoPct)" :color="excedido ? 'var(--danger)' : 'var(--accent)'" />
          <span class="faint" style="font-size: .84rem">
            <template v-if="excedido">Te pasaste por {{ formatMoney(totalMes - budget, moneda) }} del presupuesto</template>
            <template v-else>Quedan {{ formatMoney(budget - totalMes, moneda) }} de {{ formatShort(budget, moneda) }}</template>
          </span>
        </div>
      </section>

      <!-- Últimos 7 días -->
      <section class="card week">
        <div class="spread" style="gap: 10px">
          <span class="panel-title">Últimos 7 días</span>
          <Transition name="swap" mode="out-in">
            <span :key="diaElegido?.key ?? 't'" class="faint num" style="font-size: .84rem; white-space: nowrap">
              {{ diaElegido ? `${diaElegido.tip}: ${formatMoney(diaElegido.v, moneda)}` : formatMoney(semanaTotal, moneda) }}
            </span>
          </Transition>
        </div>
        <StBarChart
          fill
          :data="semanaData"
          :format="v => formatMoney(v, moneda)"
          :selected="diaSel"
          @pick="k => diaSel = diaSel === k ? null : k"
        />
      </section>

      <!-- Anotar rápido -->
      <section class="quick" aria-label="Anotar rápido">
        <span class="eyebrow quick-label">Anotar rápido</span>
        <div ref="chipsRef" :class="['quick-chips', 'scroll-x', masIzq ? 'mas-izq' : '', masDer ? 'mas-der' : '']" @scroll.passive="bordesChips">
          <button v-for="c in atajos" :key="c.id" type="button" class="quick-chip" @click="registrar({ categoria: c.id })">
            <StCatIcon :icon="c.icon" :color="c.color" :size="30" />{{ c.label }}
          </button>
        </div>
      </section>

      <!-- Últimos recibos -->
      <section class="card panel recent">
        <div class="spread panel-head">
          <span class="panel-title">Últimos recibos</span>
          <NuxtLink v-if="gastos.length" to="/movimientos" class="link-more">Ver todos</NuxtLink>
        </div>
        <StScroll v-if="recientesVista.length" class="panel-body">
          <TransitionGroup tag="div" class="rows" :css="false" @enter="onEnter" @leave="onLeave">
          <div v-for="(g, i) in recientesVista" :key="g.id" class="row-wrap stagger" :style="{ '--i': i }">
            <StGastoRow :gasto="g" show-date :date-label="dayLabel(g.date)" @open="verRecibo" @remove="anular" />
          </div>
          </TransitionGroup>
        </StScroll>
        <div v-else class="empty fill-empty">
          <span class="empty-logo"><StLogo :size="52" /></span>
          <span class="st-title" style="font-weight: 600; font-size: 1.08rem">Tu primer recibo te espera</span>
          <span class="muted" style="font-size: .9rem; max-width: 30ch">Anota lo que gastes y aquí verás cada recibo.</span>
          <button type="button" class="btn btn-primary" style="margin-top: 8px" @click="registrar()">
            <StIcon name="plus" :size="17" />Registrar gasto
          </button>
        </div>
      </section>

      <!-- A dónde se va -->
      <section class="card panel where">
        <div class="spread panel-head">
          <span class="panel-title">A dónde se va</span>
          <NuxtLink v-if="cats.length" to="/estadisticas" class="link-more">Estadísticas</NuxtLink>
        </div>
        <StScroll v-if="cats.length" class="panel-body">
          <div class="cat-lines">
          <div v-for="(c, i) in cats" :key="c.id" class="cat-line stagger" :style="{ '--i': i }">
            <StCatIcon :icon="c.icon" :color="c.color" :size="38" />
            <div class="col grow" style="gap: 8px">
              <div class="spread" style="gap: 8px">
                <span class="ellipsis" style="font-weight: 700">{{ c.label }}</span>
                <span class="num" style="font-size: .9rem; white-space: nowrap">
                  {{ formatMoney(c.value, moneda) }}
                  <span class="faint" style="margin-left: 6px">{{ Math.round(totalMes ? (c.value / totalMes) * 100 : 0) }}%</span>
                </span>
              </div>
              <StProgress :pct="totalMes ? c.value / totalMes : 0" :color="c.color" />
            </div>
          </div>
          </div>
        </StScroll>
        <div v-else class="empty fill-empty">
          <StIcon name="chart" :size="30" style="color: var(--text3)" />
          <span class="muted" style="font-size: .9rem">Aún no hay gastos esta quincena</span>
        </div>
      </section>
    </div>
  </div>
</template>
