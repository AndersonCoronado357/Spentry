<script setup lang="ts">
// Crear / editar una categoría (modal): nombre, color (selector propio) e
// icono, con vista previa viva. Quitarla: si tiene gastos, se elige a dónde moverlos.
import type { Categoria } from '~/types/gasto'
import { useDatos, PALETA, ICONOS_CAT, tintaSobre } from '~/composables/useDatos'

const props = defineProps<{ open: boolean; cat: Categoria | null }>()
const emit = defineEmits<{ close: [] }>()

const { categorias, gastos, añadirCategoria, editarCategoria, quitarCategoria } = useDatos()
const { mostrar } = useToast()

const label = ref('')
const icon = ref('tag')
const color = ref(PALETA[0]!)
const moveTo = ref('')
const confirmando = ref(false)
const error = ref('')

watch(() => props.open, (o) => {
  if (!o) return
  error.value = ''
  confirmando.value = false
  moveTo.value = ''
  if (props.cat) {
    label.value = props.cat.label
    icon.value = props.cat.icon
    color.value = props.cat.color
  } else {
    label.value = ''
    icon.value = 'tag'
    // Siguiente color de la paleta que aún no se use.
    const usados = new Set(categorias.value.map(c => c.color.toUpperCase()))
    color.value = PALETA.find(c => !usados.has(c)) ?? PALETA[categorias.value.length % PALETA.length]!
  }
})

const enUso = computed(() => (props.cat ? gastos.value.filter(g => g.category === props.cat!.id).length : 0))
const destinos = computed(() => categorias.value.filter(c => c.id !== props.cat?.id).map(c => ({ value: c.id, label: c.label })))
const valido = computed(() => label.value.trim().length > 0)

function guardar() {
  if (!valido.value) return
  if (props.cat) {
    editarCategoria(props.cat.id, { label: label.value.trim(), icon: icon.value, color: color.value })
    mostrar({ title: 'Categoría actualizada', icon: 'check' })
  } else {
    const c = añadirCategoria({ label: label.value, icon: icon.value, color: color.value })
    if (!c) { error.value = 'Ya existe una categoría con ese nombre.'; return }
    mostrar({ title: `"${c.label}" creada`, icon: 'tag' })
  }
  emit('close')
}
function quitar() {
  if (!props.cat) return
  if (enUso.value && !confirmando.value) { confirmando.value = true; return }
  if (enUso.value && !moveTo.value) { error.value = 'Elige a qué categoría mover sus gastos.'; return }
  quitarCategoria(props.cat.id, moveTo.value || undefined)
  mostrar({ title: `"${props.cat.label}" eliminada`, icon: 'trash' })
  emit('close')
}
// Tinta legible sobre el color elegido (icono marcado).
const tinta = computed(() => tintaSobre(color.value))
</script>

<template>
  <StSheet :open="open" wide :label="cat ? 'Editar categoría' : 'Nueva categoría'" @close="emit('close')">
    <div class="catf">
      <div class="reg-head" data-drag-handle>
        <span class="st-title reg-title">{{ cat ? 'Editar categoría' : 'Nueva categoría' }}</span>
        <StIconBtn name="x" bare aria-label="Cerrar" @click="emit('close')" />
      </div>

      <div class="catf-body">
        <!-- Vista previa -->
        <div class="catf-preview" :style="{ '--c': color }">
          <Transition name="swap" mode="out-in">
            <span :key="icon" class="catf-tile"><StCatIcon :icon="icon" :color="color" :size="64" /></span>
          </Transition>
          <span class="st-title catf-name ellipsis">{{ label.trim() || 'Nombre' }}</span>
        </div>

        <StField v-model="label" label="Nombre" icon="tag" placeholder="Mascotas, Café, Gimnasio…" :maxlength="40" @enter="guardar" />

        <div>
          <span class="field-label">Color</span>
          <StColorField v-model="color" />
        </div>

        <div>
          <span class="field-label">Icono</span>
          <div class="icon-grid">
            <button
              v-for="i in ICONOS_CAT"
              :key="i"
              type="button"
              :class="['icon-opt', icon === i ? 'on' : '']"
              :style="{ '--c': color, '--ink': tinta }"
              :aria-label="`Icono ${i}`"
              @click="icon = i"
            ><StIcon :name="i" :size="20" /></button>
          </div>
        </div>

        <div v-if="cat && confirmando && enUso" class="catf-move">
          <span style="font-size: .9rem; line-height: 1.45; font-weight: 600">
            <b>{{ cat.label }}</b> tiene {{ enUso }} {{ enUso === 1 ? 'gasto' : 'gastos' }}. ¿A qué categoría los movemos?
          </span>
          <StSelect v-model="moveTo" :options="destinos" placeholder="Elegir categoría" />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>
      </div>

      <div class="det-actions">
        <button v-if="cat" type="button" class="btn btn-danger" @click="quitar">
          <StIcon name="trash" :size="17" />{{ confirmando && enUso ? 'Mover y eliminar' : 'Eliminar' }}
        </button>
        <button type="button" class="btn btn-primary" :disabled="!valido" @click="guardar">
          {{ cat ? 'Guardar' : 'Crear categoría' }}
        </button>
      </div>
    </div>
  </StSheet>
</template>
