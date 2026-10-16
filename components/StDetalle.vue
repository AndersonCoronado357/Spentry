<script setup lang="ts">
// Recibo en detalle (modal): el ticket completo, editar y anular. Anular se
// hace manteniendo presionado (lento al decidir, rápido al soltar): evita
// borrados por error sin un diálogo de confirmación.
import { useDatos, folioStr, formatMoney } from '~/composables/useDatos'
import { tactil } from '~/composables/useTema'

const { detalleId, cerrarRecibo } = useDetalle()
const { porId, moneda, borrar, restaurar } = useDatos()
const { abrir } = useRegistro()
const { mostrar } = useToast()

// Se conserva el último gasto mostrado para que la hoja no se vacíe al cerrarse.
const ultimo = shallowRef(detalleId.value ? porId(detalleId.value) : undefined)
watch(detalleId, (id) => { if (id) ultimo.value = porId(id) })
const g = computed(() => (detalleId.value ? porId(detalleId.value) : undefined) ?? ultimo.value)

function editar() {
  if (!g.value) return
  const gasto = g.value
  cerrarRecibo()
  setTimeout(() => abrir({ gasto }), 120)
}

const holding = ref(false)
function holdStart() { holding.value = true; tactil(6) }
function holdEnd() { holding.value = false }
function onFill(e: TransitionEvent) {
  if (!holding.value || e.propertyName !== 'clip-path' || !g.value) return
  holding.value = false
  const gasto = g.value
  tactil([14, 40, 24])
  borrar(gasto.id)
  cerrarRecibo()
  mostrar({
    title: `Recibo N.º ${folioStr(gasto.folio)} anulado`,
    body: formatMoney(gasto.amount, gasto.currency),
    icon: 'trash',
    action: { label: 'Deshacer', run: () => restaurar(gasto) },
  })
}
</script>

<template>
  <StSheet :open="!!detalleId && !!g" label="Recibo" @close="cerrarRecibo">
    <div v-if="g" class="det">
      <div class="det-head" data-drag-handle>
        <span class="st-title" style="font-weight: 600; font-size: 1.2rem; letter-spacing: -.02em">Recibo N.º {{ folioStr(g.folio) }}</span>
        <StIconBtn name="x" bare aria-label="Cerrar" @click="cerrarRecibo" />
      </div>
      <div class="det-body">
        <div class="det-hang">
          <div class="print-slot"><i /></div>
          <div class="print-window">
            <div class="print-paper feed">
              <StTicket :gasto="g" :moneda="moneda" />
            </div>
          </div>
        </div>
      </div>
      <div class="det-actions">
        <button type="button" class="btn btn-ghost" @click="editar">
          <StIcon name="edit" :size="17" />Editar
        </button>
        <button
          type="button"
          :class="['btn', 'btn-danger', 'hold-btn', holding ? 'holding' : '']"
          @pointerdown="holdStart"
          @pointerup="holdEnd"
          @pointerleave="holdEnd"
          @pointercancel="holdEnd"
          @contextmenu.prevent
          @keydown.enter.prevent="holdStart"
          @keyup.enter="holdEnd"
        >
          <span class="hold-label"><StIcon name="trash" :size="17" />Mantén para anular</span>
          <span class="hold-fill" aria-hidden="true" @transitionend="onFill">
            <span class="hold-label"><StIcon name="trash" :size="17" />Mantén para anular</span>
          </span>
        </button>
      </div>
    </div>
  </StSheet>
</template>
