<script setup lang="ts">
// Agregar / editar un gasto fijo con la misma caja de siempre: visor con el
// monto, categorías, nombre y teclado. Cada quincena el fijo deja su recibo con
// el precio de ese momento: editar el fijo cambia desde la quincena en curso, y
// el recibo de una quincena anterior se edita solo en esa quincena.
import { useDatos, symbolOf, formatMoney, catPorId, tintaSobre, folioStr, periodoDe, etiquetaPeriodo } from '~/composables/useDatos'
import { tactil } from '~/composables/useTema'

const { hoja, cerrarFijo } = useFijoHoja()
const { categorias, moneda, gastos, crearFijo, editarFijo, quitarFijo, actualizar, borrar, restaurar } = useDatos()
const { mostrar } = useToast()

const raw = ref('')
const cat = ref('')
const label = ref('')
const displayRef = ref<HTMLElement | null>(null)
const catsRef = ref<HTMLElement | null>(null)
const masIzq = ref(false)
const masDer = ref(false)

const editando = computed(() => hoja.fijo)
// Recibo de una quincena anterior: se cambia solo ese, el fijo sigue igual.
const soloRecibo = computed(() => (!hoja.fijo && hoja.recibo ? hoja.recibo : null))
const moneda0 = computed(() => hoja.fijo?.currency ?? hoja.recibo?.currency ?? moneda.value)
const subtitulo = computed(() =>
  soloRecibo.value ? `Solo del ${etiquetaPeriodo(periodoDe(soloRecibo.value.date), true)}`
    : editando.value ? 'Cambia desde esta quincena' : 'Se repite en cada quincena',
)
const amount = computed(() => Number(raw.value || 0))
const valido = computed(() => amount.value > 0 && !!cat.value && label.value.trim().length > 0)
const catSel = computed(() => (cat.value ? catPorId(cat.value) : null))

// Primero las categorías más usadas, como en la caja.
const catsOrden = computed(() => {
  const uso: Record<string, number> = {}
  for (const g of gastos.value.slice(0, 150)) uso[g.category] = (uso[g.category] ?? 0) + 1
  return [...categorias.value].sort((a, b) => (uso[b.id] ?? 0) - (uso[a.id] ?? 0) || a.sort - b.sort)
})

// Cada dígito conserva su clave: solo el nuevo entra con animación.
const tokens = computed(() => {
  if (!raw.value) return []
  const f = amount.value.toLocaleString('es-CO')
  let di = 0
  return [...f].map((c, i) => (/\d/.test(c) ? { c, k: `d${di++}` } : { c, k: `s${f.length - i}` }))
})

watch(() => hoja.abierto, async (o) => {
  if (!o) return
  const f = hoja.fijo
  const r = hoja.recibo
  raw.value = f ? String(f.amount) : r ? String(r.amount) : ''
  cat.value = f?.category ?? r?.category ?? ''
  label.value = f?.label ?? r?.note ?? ''
  await nextTick()
  centrarCategoria(false)
  bordesCats()
})

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
function sacudir() {
  displayRef.value?.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' },
     { transform: 'translateX(-3px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }],
    { duration: 360, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
  )
  tactil([20, 30, 20])
}
function tecla(k: string) {
  if (k === 'back') raw.value = raw.value.slice(0, -1)
  else {
    if (!raw.value && (k === '0' || k === '000')) return
    const next = raw.value + k
    if (next.length > 11) { sacudir(); return }
    raw.value = next
  }
  tactil(5)
}
let holdT: ReturnType<typeof setTimeout> | null = null
function backDown() { holdT = setTimeout(() => { if (raw.value) { raw.value = ''; tactil(14) } holdT = null }, 520) }
function backUp() { if (holdT) { clearTimeout(holdT); holdT = null } }

// Teclado físico (escritorio): números, borrar y Enter, como en la caja.
function onKey(e: KeyboardEvent) {
  if (!hoja.abierto) return
  const t = e.target as HTMLElement
  const enCampo = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')
  if (e.key === 'Enter') { e.preventDefault(); guardar(); return }
  if (enCampo || e.metaKey || e.ctrlKey || e.altKey) return
  if (/^\d$/.test(e.key)) { e.preventDefault(); tecla(e.key) }
  else if (e.key === 'Backspace') { e.preventDefault(); tecla('back') }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const etiqueta = computed(() => {
  if (!amount.value) return 'Escribe el monto'
  if (!cat.value) return 'Elige una categoría'
  if (!label.value.trim()) return 'Ponle un nombre'
  return editando.value || soloRecibo.value ? 'Guardar cambios' : 'Agregar fijo'
})

function guardar() {
  if (!valido.value) { sacudir(); return }
  const datos = { label: label.value.trim(), amount: amount.value, category: cat.value }
  if (soloRecibo.value) {
    actualizar(soloRecibo.value.id, { note: datos.label, amount: datos.amount, category: datos.category })
    mostrar({ title: 'Recibo actualizado', body: `${datos.label} · ${formatMoney(datos.amount, moneda0.value)}`, icon: 'check' })
  } else if (editando.value) {
    editarFijo(editando.value.id, datos)
    mostrar({ title: 'Gasto fijo actualizado', body: `${datos.label} · ${formatMoney(datos.amount, moneda0.value)} desde esta quincena`, icon: 'check' })
  } else {
    crearFijo({ ...datos, currency: moneda.value })
    mostrar({ title: 'Gasto fijo agregado', body: `${datos.label} · ${formatMoney(datos.amount, moneda.value)} cada quincena`, icon: 'calendar' })
  }
  cerrarFijo()
}
function quitar() {
  const r = soloRecibo.value
  if (r) {
    // De una quincena anterior: se anula solo ese recibo (con deshacer).
    const g = borrar(r.id)
    if (g) mostrar({ title: `Recibo N.º ${folioStr(g.folio)} anulado`, body: formatMoney(g.amount, g.currency), icon: 'trash', action: { label: 'Deshacer', run: () => restaurar(g) } })
    cerrarFijo()
    return
  }
  const f = editando.value
  if (!f) return
  quitarFijo(f.id)
  mostrar({ title: `"${f.label}" ya no es un gasto fijo`, body: 'Las quincenas anteriores quedan igual', icon: 'trash' })
  cerrarFijo()
}
</script>

<template>
  <StSheet :open="hoja.abierto" :label="editando || soloRecibo ? 'Editar gasto fijo' : 'Nuevo gasto fijo'" @close="cerrarFijo">
    <div class="reg fase-form">
      <div class="reg-head" data-drag-handle>
        <div class="col" style="gap: 2px; min-width: 0">
          <span class="st-title reg-title">{{ editando || soloRecibo ? 'Editar gasto fijo' : 'Nuevo gasto fijo' }}</span>
          <span class="faint" style="font-size: .84rem">{{ subtitulo }}</span>
        </div>
        <div class="row" style="gap: 2px">
          <StIconBtn v-if="editando || soloRecibo" name="trash" bare :aria-label="soloRecibo ? 'Anular este recibo' : 'Quitar gasto fijo'" @click="quitar" />
          <StIconBtn name="x" bare aria-label="Cerrar" @click="cerrarFijo" />
        </div>
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
            <span class="faint" style="font-size: .8rem; font-weight: 800">{{ soloRecibo ? etiquetaPeriodo(periodoDe(soloRecibo.date), true) : 'Cada quincena' }}</span>
          </div>
          <div class="reg-amount" :aria-label="formatMoney(amount, moneda0)">
            <span class="reg-sym">{{ symbolOf(moneda0) }}</span>
            <span class="reg-digits">
              <span v-if="!tokens.length" class="reg-zero">0</span>
              <span v-for="t in tokens" :key="t.k" :class="t.k[0] === 'd' ? 'dig' : 'sep'">{{ t.c }}</span>
              <span class="reg-caret" />
            </span>
          </div>
        </div>

        <!-- Categorías -->
        <div class="reg-cats-wrap">
          <div ref="catsRef" class="reg-cats scroll-x" @scroll.passive="bordesCats">
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

        <!-- Nombre -->
        <div class="reg-meta">
          <div class="grow"><StField v-model="label" icon="tag" placeholder="Nombre: arriendo, internet…" :maxlength="80" enterkeyhint="done" /></div>
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
        <button type="button" :class="['btn', 'btn-primary', 'btn-lg', 'btn-block', 'reg-submit', valido ? '' : 'is-off']" @click="guardar">
          <Transition name="swap" mode="out-in">
            <span :key="etiqueta" class="btn-label">
              <StIcon v-if="valido" name="calendar" :size="18" />{{ etiqueta }}
            </span>
          </Transition>
          <span v-if="valido" class="num reg-submit-amt">{{ formatMoney(amount, moneda0) }}</span>
        </button>
      </div>
    </div>
  </StSheet>
</template>
