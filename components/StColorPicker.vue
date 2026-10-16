<script setup lang="ts">
// Selector de color propio (sin <input type="color">): área de saturación y
// brillo, barra de tono, colores rápidos y campo hexadecimal. Se arrastra con
// cualquier puntero (captura del puntero) y se ajusta con las flechas.
import { PALETA } from '~/composables/useDatos'

const props = withDefaults(defineProps<{ modelValue: string; presets?: boolean }>(), { presets: true })
const emit = defineEmits<{ 'update:modelValue': [v: string] }>()

// ── Conversión HSV ↔ hex ──
function hexToHsv(hex: string): [number, number, number] {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i)
  if (!m) return [95, 0.57, 0.82]
  const n = parseInt(m[1]!, 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, max ? d / max : 0, max]
}
function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255)
  }
  return '#' + [f(5), f(3), f(1)].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
}

const h = ref(0), s = ref(0), v = ref(0)
function desdeHex(hex: string) { const [a, b, c] = hexToHsv(hex); if (b > 0) h.value = a; s.value = b; v.value = c }
desdeHex(props.modelValue)
const hex = computed(() => hsvToHex(h.value, s.value, v.value))
watch(() => props.modelValue, (nv) => { if (nv.toUpperCase() !== hex.value) desdeHex(nv) })
function emitir() { emit('update:modelValue', hex.value) }

// ── Arrastre ──
const svRef = ref<HTMLElement | null>(null)
const hueRef = ref<HTMLElement | null>(null)
const arrastra = ref<'sv' | 'hue' | null>(null)
const clamp = (x: number) => Math.min(1, Math.max(0, x))

function moverSv(e: PointerEvent) {
  const r = svRef.value!.getBoundingClientRect()
  s.value = clamp((e.clientX - r.left) / r.width)
  v.value = 1 - clamp((e.clientY - r.top) / r.height)
  emitir()
}
function moverHue(e: PointerEvent) {
  const r = hueRef.value!.getBoundingClientRect()
  h.value = clamp((e.clientX - r.left) / r.width) * 359.9
  emitir()
}
function down(tipo: 'sv' | 'hue', e: PointerEvent) {
  if (arrastra.value) return
  arrastra.value = tipo
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  tipo === 'sv' ? moverSv(e) : moverHue(e)
}
function move(e: PointerEvent) {
  if (arrastra.value === 'sv') moverSv(e)
  else if (arrastra.value === 'hue') moverHue(e)
}
function up() { arrastra.value = null }

function teclaSv(e: KeyboardEvent) {
  const p = e.shiftKey ? 0.1 : 0.02
  if (e.key === 'ArrowLeft') s.value = clamp(s.value - p)
  else if (e.key === 'ArrowRight') s.value = clamp(s.value + p)
  else if (e.key === 'ArrowUp') v.value = clamp(v.value + p)
  else if (e.key === 'ArrowDown') v.value = clamp(v.value - p)
  else return
  e.preventDefault(); emitir()
}
function teclaHue(e: KeyboardEvent) {
  const p = e.shiftKey ? 20 : 4
  if (e.key === 'ArrowLeft') h.value = (h.value - p + 360) % 360
  else if (e.key === 'ArrowRight') h.value = (h.value + p) % 360
  else return
  e.preventDefault(); emitir()
}

// ── Campo hex ──
const hexTxt = ref(hex.value.slice(1))
watch(hex, (nv) => { if (document.activeElement !== hexRef.value) hexTxt.value = nv.slice(1) })
const hexRef = ref<HTMLInputElement | null>(null)
function onHex(e: Event) {
  const val = (e.target as HTMLInputElement).value.replace(/[^0-9a-f]/gi, '').slice(0, 6)
  hexTxt.value = val
  if (val.length === 6) { desdeHex('#' + val); emitir() }
}
function elegir(c: string) { desdeHex(c); emitir() }
</script>

<template>
  <div class="cp">
    <div
      ref="svRef"
      class="cp-sv"
      :class="{ grab: arrastra === 'sv' }"
      :style="{ '--hue': `hsl(${h} 100% 50%)` }"
      role="slider"
      tabindex="0"
      aria-label="Saturación y brillo"
      :aria-valuetext="hex"
      @pointerdown="down('sv', $event)"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
      @keydown="teclaSv"
    >
      <span class="cp-knob" :style="{ left: s * 100 + '%', top: (1 - v) * 100 + '%', background: hex }" />
    </div>

    <div
      ref="hueRef"
      class="cp-hue"
      :class="{ grab: arrastra === 'hue' }"
      role="slider"
      tabindex="0"
      aria-label="Tono"
      :aria-valuenow="Math.round(h)"
      aria-valuemin="0"
      aria-valuemax="360"
      @pointerdown="down('hue', $event)"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
      @keydown="teclaHue"
    >
      <span class="cp-knob" :style="{ left: (h / 360) * 100 + '%', background: `hsl(${h} 100% 50%)` }" />
    </div>

    <div class="cp-foot">
      <div v-if="presets" class="cp-swatches">
        <button
          v-for="c in PALETA"
          :key="c"
          type="button"
          :class="['cp-sw', hex === c ? 'on' : '']"
          :style="{ background: c }"
          :aria-label="`Usar ${c}`"
          @click="elegir(c)"
        />
      </div>
      <label class="cp-hex">
        <span class="cp-chip" :style="{ background: hex }" />
        <span class="faint">#</span>
        <input
          ref="hexRef"
          :value="hexTxt"
          maxlength="6"
          spellcheck="false"
          autocomplete="off"
          aria-label="Color en hexadecimal"
          @input="onHex"
          @blur="hexTxt = hex.slice(1)"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.cp { display: flex; flex-direction: column; gap: 14px; }
.cp-sv {
  position: relative; height: 180px; border-radius: 20px; cursor: crosshair; touch-action: none;
  background:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, var(--hue));
}
.cp-hue {
  position: relative; height: 18px; border-radius: 999px; cursor: pointer; touch-action: none; margin: 0 2px;
  background: linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00);
}
.cp-knob {
  position: absolute; width: 24px; height: 24px; border-radius: 999px; pointer-events: none;
  border: 3px solid #fff; transform: translate(-50%, -50%) scale(1);
  box-shadow: 0 0 0 1px rgb(0 0 0 / .14);
  transition: transform .16s var(--ease-out);
}
.cp-hue .cp-knob { top: 50%; width: 26px; height: 26px; }
.cp-sv:not(.grab) .cp-knob { transition: transform .16s var(--ease-out), left .2s var(--ease-out), top .2s var(--ease-out); }
.cp-hue:not(.grab) .cp-knob { transition: transform .16s var(--ease-out), left .2s var(--ease-out); }
.grab .cp-knob { transform: translate(-50%, -50%) scale(1.18); }
.cp-foot { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: space-between; }
.cp-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.cp-sw {
  width: 26px; height: 26px; border-radius: 999px; border: 0; cursor: pointer; padding: 0;
  box-shadow: 0 0 0 0 var(--s1), 0 0 0 0 transparent;
  transition: transform .16s var(--ease-out), box-shadow .2s var(--ease-out);
}
.cp-sw:active { transform: scale(.88); }
.cp-sw.on { box-shadow: 0 0 0 3px var(--s1), 0 0 0 5px var(--text); }
.cp-hex {
  flex: 1; display: inline-flex; align-items: center; gap: 6px; background: var(--s2); border-radius: 999px;
  padding: 6px 14px 6px 6px; font-weight: 700;
}
.cp-chip { width: 28px; height: 28px; border-radius: 999px; flex-shrink: 0; }
.cp-hex input {
  width: 4.6em; border: 0; background: transparent; color: var(--text); font-family: var(--font-title);
  font-size: .95rem; font-weight: 600; text-transform: uppercase; padding: 4px 0; letter-spacing: .04em;
}
</style>
