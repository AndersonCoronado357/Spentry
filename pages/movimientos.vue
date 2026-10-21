<script setup lang="ts">
import {
  hoy, inPeriodo, total, groupByDay, byCategory, formatMoney, folioStr, DIAS_COR, MESES_COR,
  daysBetween, catPorId, periodoDe, ordenPeriodo, etiquetaPeriodo, type Periodo,
} from '~/composables/useDatos'

useHead({ title: 'Movimientos · Spentry' })

const route = useRoute()
const { gastos, moneda, categorias, borrar, restaurar } = useDatos()
const { verRecibo } = useDetalle()
const { abrir } = useRegistro()
const { mostrar } = useToast()
const { onEnter, onLeave } = useListaAnimada()

const per = ref<Periodo>(periodoDe(hoy()))
const q = ref('')
const cat = ref<string>(typeof route.query.cat === 'string' ? route.query.cat : 'todas')

const delMes = computed(() => inPeriodo(gastos.value, per.value))
const filtrados = computed(() => {
  const s = q.value.trim().toLowerCase()
  return delMes.value.filter(g =>
    (cat.value === 'todas' || g.category === cat.value) &&
    (!s || g.note.toLowerCase().includes(s) || catPorId(g.category).label.toLowerCase().includes(s) || folioStr(g.folio).includes(s)),
  )
})
const grupos = computed(() => groupByDay(filtrados.value, moneda.value))
const totalFiltro = computed(() => total(filtrados.value, moneda.value))
const totalMes = computed(() => total(delMes.value, moneda.value))
const catsMes = computed(() => byCategory(delMes.value, moneda.value))
const usadas = computed(() => categorias.value.filter(c => delMes.value.some(g => g.category === c.id)))
const diaMayor = computed(() => {
  const g = groupByDay(delMes.value, moneda.value)
  return g.reduce<typeof g[number] | null>((a, b) => (!a || b.total > a.total ? b : a), null)
})
const promedioRecibo = computed(() => (delMes.value.length ? totalMes.value / delMes.value.length : 0))

// La lista se re-monta al cambiar de quincena o filtro (sin animar cada fila); las
// altas y bajas dentro de una misma vista sí se animan.
const vistaKey = computed(() => `${ordenPeriodo(per.value)}-${cat.value}-${q.value.trim()}`)

function cabecera(d: Date) {
  const n = daysBetween(d, hoy())
  const base = `${DIAS_COR[d.getDay()]} ${d.getDate()} ${MESES_COR[d.getMonth()]}`
  return n === 0 ? `Hoy · ${base}` : n === 1 ? `Ayer · ${base}` : base
}
// Celular: la quincena va junto al título, abreviada, y el filtro de categorías se
// comprime en un botón al lado del buscador.
const movil = useMediaQuery('(max-width: 899px)')
// La cinta se imprime solo al entrar a la vista (ver .movs-entrando en CSS).
const entrando = ref(true)
onMounted(() => setTimeout(() => { entrando.value = false }, 1300))
const filtroRef = ref<HTMLElement | null>(null)
const filtroAbierto = ref(false)
const catFiltro = computed(() => (cat.value === 'todas' ? null : catPorId(cat.value)))
function elegirFiltro(id: string) {
  cat.value = id
  filtroAbierto.value = false
}

// Al cambiar de quincena la cinta entra desde el lado hacia el que se navega.
const dirMes = ref<'next' | 'prev'>('next')
function cambiarMes(p: Periodo) {
  dirMes.value = ordenPeriodo(p) > ordenPeriodo(per.value) ? 'next' : 'prev'
  per.value = p
}

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
  <div :class="['screen', 'fill', 'movs-screen', entrando ? 'movs-entrando' : '']">
    <header class="page-head">
      <div class="col grow" style="min-width: 0">
        <span class="eyebrow">Tus recibos</span>
        <h1 class="page-title">Movimientos</h1>
      </div>
      <StMonthSwitch :y="per.y" :m="per.m" :q="per.q" :corto="movil" @change="cambiarMes" />
    </header>

    <div class="movs-grid">
      <div class="movs-main">
        <div class="movs-controls">
          <div class="movs-search">
            <div class="grow" style="min-width: 0">
              <StField v-model="q" icon="search" placeholder="Buscar por nota, categoría o folio" enterkeyhint="search" />
            </div>
            <!-- Celular: las categorías se comprimen en este botón (abre una ventanita). -->
            <button
              ref="filtroRef"
              type="button"
              :class="['filtro-btn', 'only-mobile', catFiltro ? 'on' : '']"
              :style="catFiltro ? { '--c': catFiltro.color } : undefined"
              :aria-label="catFiltro ? `Filtrando por ${catFiltro.label}` : 'Filtrar por categoría'"
              :aria-expanded="filtroAbierto"
              @click="filtroAbierto = !filtroAbierto"
            >
              <Transition name="swap" mode="out-in">
                <StIcon :key="catFiltro?.id ?? 'todas'" :name="catFiltro ? catFiltro.icon : 'filter'" :size="19" />
              </Transition>
            </button>
          </div>
          <StPopover :anchor="filtroRef" :open="filtroAbierto" :width="300" align="right" fit @close="filtroAbierto = false">
            <div class="filtro-pop">
              <span class="field-label">Categoría</span>
              <div class="filtro-chips">
                <button type="button" :class="['chip', cat === 'todas' ? 'on' : '']" style="--c: var(--accent)" @click="elegirFiltro('todas')">Todas</button>
                <button
                  v-for="c in usadas"
                  :key="c.id"
                  type="button"
                  :class="['chip', cat === c.id ? 'on' : '']"
                  :style="{ '--c': c.color }"
                  @click="elegirFiltro(cat === c.id ? 'todas' : c.id)"
                >
                  <StIcon :name="c.icon" :size="15" />{{ c.label }}
                </button>
              </div>
            </div>
          </StPopover>
          <div class="chips-row scroll-x only-desktop">
            <button type="button" :class="['chip', cat === 'todas' ? 'on' : '']" @click="cat = 'todas'">Todas</button>
            <button
              v-for="c in usadas"
              :key="c.id"
              type="button"
              :class="['chip', cat === c.id ? 'on' : '']"
              @click="cat = cat === c.id ? 'todas' : c.id"
            >
              <StIcon :name="c.icon" :size="15" />{{ c.label }}
            </button>
          </div>
        </div>

        <!-- Cinta de recibos: el papel queda quieto y lo de adentro hace scroll -->
        <Transition :name="`mes-${dirMes}`" mode="out-in">
        <div :key="vistaKey" class="tape">
          <div class="tape-sum">
            <span class="faint">{{ filtrados.length }} {{ filtrados.length === 1 ? 'recibo' : 'recibos' }}</span>
            <span class="num" style="font-weight: 600">{{ formatMoney(totalFiltro, moneda) }}</span>
          </div>
          <StScroll class="tape-scroll">
            <template v-if="grupos.length">
              <section v-for="grp in grupos" :key="grp.key" class="tape-day">
                <div class="tape-day-head">
                  <span>{{ cabecera(grp.date) }}</span>
                  <i class="tape-dots" />
                  <span class="num">{{ formatMoney(grp.total, moneda) }}</span>
                </div>
                <TransitionGroup tag="div" class="tape-rows" :css="false" @enter="onEnter" @leave="onLeave">
                  <div v-for="g in grp.items" :key="g.id" class="row-wrap">
                    <StGastoRow :gasto="g" @open="verRecibo" @remove="anular" />
                  </div>
                </TransitionGroup>
              </section>
              <div class="tape-end">
                <span>Total {{ etiquetaPeriodo(per, true) }}</span>
                <i class="tape-dots" />
                <span class="num">{{ formatMoney(totalFiltro, moneda) }}</span>
              </div>
            </template>
            <div v-else class="empty fill-empty">
              <span class="empty-logo"><StLogo :size="50" /></span>
              <template v-if="delMes.length">
                <span class="st-title" style="font-weight: 600">Nada coincide</span>
                <span class="muted" style="font-size: .9rem">Prueba con otra búsqueda o categoría.</span>
              </template>
              <template v-else>
                <span class="st-title" style="font-weight: 600">Sin recibos del {{ etiquetaPeriodo(per, true) }}</span>
                <span class="muted" style="font-size: .9rem">Cuando anotes un gasto aparecerá aquí.</span>
                <button type="button" class="btn btn-primary" style="margin-top: 8px" @click="abrir()">
                  <StIcon name="plus" :size="17" />Registrar gasto
                </button>
              </template>
            </div>
          </StScroll>
        </div>
        </Transition>
      </div>

      <!-- Resumen del mes (escritorio ancho) -->
      <aside class="movs-side">
        <div class="card side-card">
          <span class="eyebrow">Total del {{ etiquetaPeriodo(per, true) }}</span>
          <span class="side-total"><StOdometer :value="totalMes" :code="moneda" /></span>
          <div class="side-stats">
            <div><span class="faint">Recibos</span><b class="num">{{ delMes.length }}</b></div>
            <div><span class="faint">Promedio por recibo</span><b class="num">{{ formatMoney(promedioRecibo, moneda) }}</b></div>
            <div v-if="diaMayor">
              <span class="faint">Día de más gasto</span>
              <b class="num">{{ cabecera(diaMayor.date).replace(/^(Hoy|Ayer) · /, '') }} · {{ formatMoney(diaMayor.total, moneda) }}</b>
            </div>
          </div>
        </div>
        <div class="card side-card side-cats">
          <span class="panel-title">Por categoría</span>
          <StScroll v-if="catsMes.length" class="side-cats-list">
            <button
              v-for="(c, i) in catsMes"
              :key="c.id"
              type="button"
              :class="['side-cat', 'stagger', cat === c.id ? 'on' : '']"
              :style="{ '--i': i }"
              @click="cat = cat === c.id ? 'todas' : c.id"
            >
              <StCatIcon :icon="c.icon" :color="c.color" :size="34" />
              <span class="grow ellipsis" style="text-align: left">{{ c.label }}</span>
              <span class="num" style="font-size: .9rem">{{ formatMoney(c.value, moneda) }}</span>
            </button>
          </StScroll>
          <div v-else class="empty fill-empty">
            <span class="muted" style="font-size: .9rem">Sin gastos este mes</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
