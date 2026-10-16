<script setup lang="ts">
// Recortador de avatar (estilo Sprout): visor circular, zoom con rueda/pellizco
// y arrastrar para encuadrar. Devuelve un data URL JPEG cuadrado (256px).
const props = defineProps<{ file: File }>()
const emit = defineEmits<{ cancel: []; done: [dataUrl: string] }>()

const C = 300 // diámetro del visor (px)
const OUT = 256 // imagen exportada (px)

const url = ref('')
const W = ref(0)
const H = ref(0)
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const procesando = ref(false)
let imgEl: HTMLImageElement | null = null

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

onMounted(() => {
  const u = URL.createObjectURL(props.file)
  url.value = u
  const img = new Image()
  img.onload = () => {
    W.value = img.naturalWidth
    H.value = img.naturalHeight
    imgEl = img
  }
  img.src = u
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  if (url.value) URL.revokeObjectURL(url.value)
  window.removeEventListener('keydown', onKey)
})

const coverScale = computed(() => (W.value && H.value ? Math.max(C / W.value, C / H.value) : 1))
const drawScale = computed(() => coverScale.value * zoom.value)
const dispW = computed(() => W.value * drawScale.value)
const dispH = computed(() => H.value * drawScale.value)
const halfX = computed(() => (C - dispW.value) / 2)
const halfY = computed(() => (C - dispH.value) / 2)
const imgLeft = computed(() => halfX.value + clamp(panX.value, halfX.value, -halfX.value))
const imgTop = computed(() => halfY.value + clamp(panY.value, halfY.value, -halfY.value))

type Punto = { id: number; x: number; y: number }
let punteros: Punto[] = []
let lastX = 0
let lastY = 0
let pinchDist = 0
let pinchZoom = 1
const grabbing = ref(false)

const guia = ref(false)
let timerGuia: ReturnType<typeof setTimeout> | null = null
function tocarGuia() {
  guia.value = true
  if (timerGuia) clearTimeout(timerGuia)
  timerGuia = setTimeout(() => (guia.value = false), 700)
}
const dist = (a: Punto, b: Punto) => Math.hypot(a.x - b.x, a.y - b.y)

function onDown(e: PointerEvent) {
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  punteros = [...punteros, { id: e.pointerId, x: e.clientX, y: e.clientY }]
  grabbing.value = true
  if (punteros.length === 1) {
    lastX = e.clientX
    lastY = e.clientY
  } else if (punteros.length === 2) {
    pinchDist = dist(punteros[0]!, punteros[1]!)
    pinchZoom = zoom.value
  }
  tocarGuia()
}
function onMove(e: PointerEvent) {
  const idx = punteros.findIndex((p) => p.id === e.pointerId)
  if (idx === -1) return
  punteros[idx] = { id: e.pointerId, x: e.clientX, y: e.clientY }
  if (punteros.length === 1) {
    panX.value = clamp(panX.value + (e.clientX - lastX), halfX.value, -halfX.value)
    panY.value = clamp(panY.value + (e.clientY - lastY), halfY.value, -halfY.value)
    lastX = e.clientX
    lastY = e.clientY
  } else if (punteros.length === 2) {
    const d = dist(punteros[0]!, punteros[1]!)
    if (pinchDist > 0) zoom.value = clamp(pinchZoom * (d / pinchDist), 1, 3)
  }
  tocarGuia()
}
function onUp(e: PointerEvent) {
  punteros = punteros.filter((p) => p.id !== e.pointerId)
  if (punteros.length === 0) grabbing.value = false
  else if (punteros.length === 1) {
    lastX = punteros[0]!.x
    lastY = punteros[0]!.y
  }
  tocarGuia()
}
function onWheel(e: WheelEvent) {
  e.preventDefault()
  zoom.value = clamp(zoom.value * (e.deltaY > 0 ? 0.94 : 1.06), 1, 3)
  tocarGuia()
}
function centrar() {
  zoom.value = 1
  panX.value = 0
  panY.value = 0
  tocarGuia()
}
function guardar() {
  if (!imgEl || procesando.value) return
  procesando.value = true
  const canvas = document.createElement('canvas')
  canvas.width = OUT
  canvas.height = OUT
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    procesando.value = false
    return
  }
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, OUT, OUT)
  const s = OUT / C
  ctx.drawImage(imgEl, imgLeft.value * s, imgTop.value * s, dispW.value * s, dispH.value * s)
  emit('done', canvas.toDataURL('image/jpeg', 0.88))
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && !procesando.value) emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <div class="crop-overlay" role="dialog" aria-modal="true" aria-label="Ajustar foto de perfil">
      <div class="crop-card">
        <header class="crop-head">
          <div style="min-width: 0">
            <h2 class="crop-title">Ajusta tu foto</h2>
            <p class="crop-sub">Arrastra para encuadrar · rueda o pellizca para acercar</p>
          </div>
          <button type="button" class="crop-x" aria-label="Cerrar" :disabled="procesando" @click="emit('cancel')">
            <StIcon name="x" :size="18" />
          </button>
        </header>

        <div class="crop-stage">
          <div
            class="crop-visor"
            :style="{ cursor: grabbing ? 'grabbing' : 'grab' }"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onUp"
            @wheel="onWheel"
          >
            <img
              v-if="url"
              :src="url"
              alt=""
              draggable="false"
              :style="{
                position: 'absolute', maxWidth: 'none', userSelect: 'none', pointerEvents: 'none',
                width: dispW + 'px', height: dispH + 'px', left: imgLeft + 'px', top: imgTop + 'px',
              }"
            />
            <div class="crop-guides" :style="{ opacity: guia ? 1 : 0 }">
              <i style="top: 0; bottom: 0; left: 33.33%; width: 1px" />
              <i style="top: 0; bottom: 0; left: 66.66%; width: 1px" />
              <i style="left: 0; right: 0; top: 33.33%; height: 1px" />
              <i style="left: 0; right: 0; top: 66.66%; height: 1px" />
            </div>
            <div class="crop-ring" />
          </div>

          <button
            type="button"
            class="crop-center"
            :disabled="zoom === 1 && panX === 0 && panY === 0"
            @click="centrar"
          >
            Centrar
          </button>
        </div>

        <footer class="crop-foot">
          <StButton variant="ghost" :disabled="procesando" @click="emit('cancel')">
            Cancelar
          </StButton>
          <StButton variant="primary" :disabled="procesando || !W" @click="guardar">
            <StIcon name="image" :size="16" />Usar foto
          </StButton>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.crop-overlay {
  position: fixed; inset: 0; z-index: 200; display: grid; place-items: center;
  background: rgba(0, 0, 0, 0.62); padding: 16px;
  animation: cropfade 0.18s var(--ease);
}
@keyframes cropfade { from { opacity: 0; } to { opacity: 1; } }
.crop-card {
  width: 100%; max-width: 400px; background: var(--s1);
  border-radius: var(--radius-lg); overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}
.crop-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 18px 22px 6px;
}
.crop-title { font-family: var(--font-title); font-weight: 600; font-size: 1.05rem; color: var(--text); margin: 0; }
.crop-sub { font-size: .78rem; color: var(--text3); margin: 3px 0 0; }
.crop-x {
  display: grid; place-items: center; width: 34px; height: 34px; flex-shrink: 0;
  border: 0; border-radius: 11px; background: transparent; color: var(--text3); cursor: pointer;
  transition: background .15s, color .15s;
}
.crop-x:hover { background: var(--s2); color: var(--text); }
.crop-stage {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: 18px 24px 10px;
}
.crop-visor {
  position: relative; width: 300px; height: 300px; max-width: 100%;
  overflow: hidden; border-radius: 999px; background: #0b0c0d;
  touch-action: none; user-select: none; aspect-ratio: 1;
}
.crop-guides { position: absolute; inset: 0; pointer-events: none; transition: opacity .3s; }
.crop-guides i { position: absolute; background: rgba(255, 255, 255, 0.4); }
.crop-ring {
  position: absolute; inset: 0; border-radius: 999px; pointer-events: none;
}
.crop-center {
  border: 0; background: transparent; border-radius: 999px; padding: 7px 14px;
  font-family: var(--font-body); font-weight: 600; font-size: .8rem; color: var(--text3); cursor: pointer;
  transition: background .15s, color .15s;
}
.crop-center:hover:not(:disabled) { background: var(--accent-soft); color: color-mix(in srgb, var(--accent) 80%, var(--text)); }
.crop-center:disabled { opacity: .4; cursor: default; }
.crop-foot {
  display: flex; gap: 10px; padding: 10px 22px 20px;
}
.crop-foot > :deep(.btn) { flex: 1; }
</style>
