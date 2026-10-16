<script setup lang="ts">
// La caja registradora (modal): monto, categorías, nota, fecha y teclado.
// Al registrar, el recibo sale impreso por la ranura y la hoja se cierra.
import type { Gasto } from '~/types/gasto'
import { useDatos, nuevoId, hoy, symbolOf, formatMoney, catPorId, folioStr, tintaSobre } from '~/composables/useDatos'
import { prefiereMenosMovimiento, tactil } from '~/composables/useTema'

const { reg, cerrar } = useRegistro()
const { categorias, moneda, crear, actualizar, borrar, gastos } = useDatos()
const { mostrar } = useToast()

const raw = ref('')
const cat = ref('')
const note = ref('')
const date = ref<Date>(hoy())
const fase = ref<'form' | 'print' | 'tear'>('form')
const impreso = ref<Gasto | null>(null)
const displayRef = ref<HTMLElement | null>(null)
const raizRef = ref<HTMLElement | null>(null)
const catsRef = ref<HTMLElement | null>(null)
const pista = ref(false)
// Desvanecido en el lado de la fila de categorías donde quedan más por ver.
const masIzq = ref(false)
const masDer = ref(false)

const editando = computed(() => !!reg.gasto)
const moneda0 = computed(() => reg.gasto?.currency ?? moneda.value)
const amount = computed(() => Number(raw.value || 0))
const valido = computed(() => amount.value > 0 && !!cat.value)
const catSel = computed(() => (cat.value ? catPorId(cat.value) : null))

// Primero las categorías más usadas (anotar rápido lo de siempre).
const catsOrden = computed(() => {
  const uso: Record<string, number> = {}
  for (const g of gastos.value.slice(0, 150)) uso[g.category] = (uso[g.category] ?? 0) + 1
  return [...categorias.value].sort((a, b) => (uso[b.id] ?? 0) - (uso[a.id] ?? 0) || a.sort - b.sort)
})

// Cada dígito conserva su clave (el n-ésimo tecleado): solo el nuevo entra con
// animación; los puntos de miles se recolocan solos.
const tokens = computed(() => {
  if (!raw.value) return []
  const f = amount.value.toLocaleString('es-CO')
  let di = 0
  return [...f].map((c, i) => (/\d/.test(c) ? { c, k: `d${di++}` } : { c, k: `s${f.length - i}` }))
})

watch(() => reg.abierto, async (o) => {
  if (!o) return
  fase.value = 'form'
  impreso.value = null
  pista.value = false
  const g = reg.gasto
  raw.value = g ? String(g.amount) : ''
  cat.value = g ? g.category : (reg.categoria || '')
  note.value = g?.note ?? ''
  date.value = g ? new Date(g.date) : hoy()
  await nextTick()
  centrarCategoria(false)
  bordesCats()
})
watch(cat, () => { pista.value = false })

function bordesCats() {
  const e = catsRef.value
  if (!e) return
  masIzq.value = e.scrollLeft > 2
  masDer.value = e.scrollLeft < e.scrollWidth - e.clientWidth - 2
}
function centrarCategoria(suave = true) {
  const el = catsRef.value?.querySelector<HTMLElement>('.reg-cat.on')
  el?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', inline: 'center', block: 'nearest' })
}
function elegirCat(id: string) {
  cat.value = id
  tactil(6)
  nextTick(() => centrarCategoria())
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'back']
// Sacudida corta del visor: un "no" sin palabras (sin monto, tope de dígitos…).
function sacudir() {
  displayRef.value?.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' },
     { transform: 'translateX(-3px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }],
    { duration: 360, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  )
  tactil([20, 30, 20])
}
function tecla(k: string) {
  if (fase.value !== 'form') return
  if (k === 'back') raw.value = raw.value.slice(0, -1)
  else {
    if (!raw.value && (k === '0' || k === '000')) return
    const next = raw.value + k
    if (next.length > 11) { sacudir(); return }
    raw.value = next
  }
  tactil(5)
}

// Mantener borrar = limpiar todo.
let holdT: ReturnType<typeof setTimeout> | null = null
function backDown() { holdT = setTimeout(() => { if (raw.value) { raw.value = ''; tactil(14) } holdT = null }, 520) }
function backUp() { if (holdT) { clearTimeout(holdT); holdT = null } }

// Teclado físico (escritorio): números, borrar y Enter.
function onKey(e: KeyboardEvent) {
  if (!reg.abierto || fase.value !== 'form') return
  const t = e.target as HTMLElement
  const enCampo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
  if (e.key === 'Enter') { e.preventDefault(); registrar(); return }
  if (enCampo || e.metaKey || e.ctrlKey || e.altKey) return
  if (/^\d$/.test(e.key)) { e.preventDefault(); tecla(e.key) }
  else if (e.key === 'Backspace') { e.preventDefault(); tecla('back') }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const etiqueta = computed(() => {
  if (!amount.value) return 'Escribe el monto'
  if (!cat.value) return 'Elige una categoría'
  return editando.value ? 'Guardar cambios' : 'Registrar gasto'
})

let finT: ReturnType<typeof setTimeout> | null = null
let avisoPendiente: (() => void) | null = null

function avisoCreado(g: Gasto) {
  return () => mostrar({
    title: `Recibo N.º ${folioStr(g.folio)} guardado`,
    body: `${formatMoney(g.amount, g.currency)} en ${catPorId(g.category).label}`,
    icon: 'receipt',
    action: { label: 'Deshacer', run: () => { borrar(g.id); mostrar({ title: 'Recibo anulado', icon: 'undo' }) } },
  })
}

function registrar() {
  if (fase.value !== 'form') return
  if (!valido.value) {
    sacudir()
    if (amount.value && !cat.value) pista.value = true
    return
  }
  const datos = { amount: amount.value, category: cat.value, note: note.value.trim(), date: date.value }

  if (reg.gasto) {
    actualizar(reg.gasto.id, datos)
    cerrar()
    mostrar({ title: 'Recibo actualizado', body: `N.º ${folioStr(reg.gasto.folio)} · ${formatMoney(datos.amount, reg.gasto.currency)}`, icon: 'check' })
    return
  }

  const g = crear({ id: nuevoId(), currency: moneda.value, ...datos })
  impreso.value = g
  const avisar = avisoCreado(g)
  if (prefiereMenosMovimiento()) { cerrar(); avisar(); return }

  // Imprime: el papel sale a tirones, se sostiene un instante, se arranca y la
  // hoja baja. Tocar la pantalla lo acelera. La hoja se encoge a la medida del
  // recibo (de su tamaño de formulario al de la ranura con el papel).
  const hoja = raizRef.value?.closest<HTMLElement>('.sheet')
  const antes = hoja?.getBoundingClientRect()
  fase.value = 'print'
  if (hoja && antes) nextTick(() => ajustarHoja(hoja, antes))
  avisoPendiente = avisar
  tactil([10, 60, 10, 60, 10, 60, 10])
  finT = setTimeout(() => arrancar(avisar), 3200)   // respaldo si la animación no corre
}
function ajustarHoja(hoja: HTMLElement, antes: DOMRect) {
  const despues = hoja.getBoundingClientRect()
  hoja.animate(
    [{ width: `${antes.width}px`, height: `${antes.height}px` }, { width: `${despues.width}px`, height: `${despues.height}px` }],
    { duration: 480, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
  )
}
function papelListo() {
  if (fase.value !== 'print' || !avisoPendiente) return
  const avisar = avisoPendiente
  if (finT) clearTimeout(finT)
  finT = setTimeout(() => arrancar(avisar), 1100)    // el recibo completo queda a la vista un momento
}
function arrancar(avisar: () => void) {
  if (fase.value === 'tear') return
  avisoPendiente = null
  if (finT) { clearTimeout(finT); finT = null }
  fase.value = 'tear'
  tactil(12)
  setTimeout(() => { cerrar(); avisar() }, 240)
}
function saltar() {
  if (fase.value !== 'print' || !impreso.value) return
  arrancar(avisoPendiente ?? avisoCreado(impreso.value))
}
onBeforeUnmount(() => { if (finT) clearTimeout(finT) })

function onClose() {
  if (fase.value === 'print') { saltar(); return }
  cerrar()
}
</script>

<template>
  <StSheet :open="reg.abierto" :instant="reg.instantaneo" :label="editando ? 'Editar gasto' : 'Registrar gasto'" @close="onClose">
    <div ref="raizRef" :class="['reg', `fase-${fase}`]">
      <div class="reg-head" data-drag-handle>
        <div class="col" style="gap: 2px; min-width: 0">
          <span class="st-title reg-title">{{ editando ? 'Editar gasto' : 'Nuevo gasto' }}</span>
          <span class="faint" style="font-size: .84rem">
            {{ editando ? `Recibo N.º ${folioStr(reg.gasto!.folio)}` : 'Teclea el monto como en la caja' }}
          </span>
        </div>
        <StIconBtn name="x" bare aria-label="Cerrar" @click="onClose" />
      </div>

      <div class="reg-body">
        <!-- Visor -->
        <div ref="displayRef" class="reg-display">
          <div class="reg-display-top">
            <Transition name="swap" mode="out-in">
              <span v-if="catSel" :key="catSel.id" class="reg-display-cat">
                <StCatIcon :icon="catSel.icon" :color="catSel.color" :size="26" />{{ catSel.label }}
              </span>
              <span v-else key="none" class="reg-display-cat faint">Sin categoría</span>
            </Transition>
            <span class="faint" style="font-size: .8rem; font-weight: 800">{{ moneda0 }}</span>
          </div>
          <div class="reg-amount" aria-live="polite" :aria-label="formatMoney(amount, moneda0)">
            <span class="reg-sym">{{ symbolOf(moneda0) }}</span>
            <span class="reg-digits">
              <span v-if="!tokens.length" class="reg-zero">0</span>
              <span v-for="t in tokens" :key="t.k" :class="t.k[0] === 'd' ? 'dig' : 'sep'">{{ t.c }}</span>
              <span class="reg-caret" />
            </span>
          </div>
        </div>

        <!-- Categorías -->
        <div v-if="categorias.length" class="reg-cats-wrap">
          <div ref="catsRef" :class="['reg-cats', 'scroll-x', pista ? 'pista' : '']" @scroll.passive="bordesCats">
            <button
              v-for="c in catsOrden"
              :key="c.id"
              type="button"
              :class="['reg-cat', cat === c.id ? 'on' : '']"
              :style="{ '--c': c.color, '--ink': tintaSobre(c.color) }"
              @click="elegirCat(c.id)"
            >
              <span class="reg-cat-ic"><StIcon :name="c.icon" :size="16" /></span>
              {{ c.label }}
            </button>
          </div>
          <i :class="['reg-cats-fade', 'l', masIzq ? 'on' : '']" aria-hidden="true" />
          <i :class="['reg-cats-fade', 'r', masDer ? 'on' : '']" aria-hidden="true" />
        </div>
        <NuxtLink v-else to="/categorias" class="chip" style="align-self: flex-start" @click="cerrar()">
          <StIcon name="plus" :size="15" />Crear categoría
        </NuxtLink>

        <!-- Nota + fecha -->
        <div class="reg-meta">
          <div class="grow"><StField v-model="note" icon="note" placeholder="Nota (opcional)" :maxlength="200" enterkeyhint="done" /></div>
          <StDateChip v-model="date" />
        </div>

        <!-- Teclado -->
        <div class="keypad" role="group" aria-label="Teclado numérico">
          <button
            v-for="k in KEYS"
            :key="k"
            type="button"
            :class="['key', k === 'back' ? 'key-back' : '', k === '000' ? 'key-000' : '']"
            :aria-label="k === 'back' ? 'Borrar (mantén para limpiar)' : k"
            @click="tecla(k)"
            @pointerdown="k === 'back' && backDown()"
            @pointerup="backUp"
            @pointerleave="backUp"
            @pointercancel="backUp"
          >
            <StIcon v-if="k === 'back'" name="backspace" :size="22" />
            <template v-else>{{ k }}</template>
          </button>
        </div>
      </div>

      <div class="reg-foot">
        <button type="button" :class="['btn', 'btn-primary', 'btn-lg', 'btn-block', 'reg-submit', valido ? '' : 'is-off']" @click="registrar">
          <Transition name="swap" mode="out-in">
            <span :key="etiqueta" class="btn-label">
              <StIcon v-if="valido" name="receipt" :size="18" />{{ etiqueta }}
            </span>
          </Transition>
          <span v-if="valido" class="num reg-submit-amt">{{ formatMoney(amount, moneda0) }}</span>
        </button>
      </div>

      <!-- Impresión del recibo -->
      <div v-if="fase !== 'form' && impreso" class="print-stage" @click="saltar">
        <div class="print-slot"><i /></div>
        <div class="print-window">
          <div class="print-paper feed" @animationend.self="papelListo">
            <StTicket :gasto="impreso" :moneda="moneda" />
          </div>
        </div>
      </div>
    </div>
  </StSheet>
</template>
