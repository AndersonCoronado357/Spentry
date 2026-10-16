<script setup lang="ts">
// Logo de Spentry: la ranura de la caja registradora y el recibo saliendo.
// Con `print`, el recibo sale de la ranura a tirones (como una impresora
// térmica) una sola vez al montar. Color por currentColor.
interface Props { size?: number | string; print?: boolean; delay?: number }
const props = withDefaults(defineProps<Props>(), { size: 24, print: false, delay: 0 })
const px = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
const clip = `st-logo-${useId()}`
</script>

<template>
  <svg
    :width="px"
    :height="px"
    viewBox="200 200 624 624"
    aria-hidden="true"
    :class="['st-logo', print ? 'is-print' : '']"
    :style="{ '--d': delay + 'ms' }"
  >
    <defs>
      <!-- Todo lo que quede por encima de la boca de la ranura no se ve. -->
      <clipPath :id="clip"><rect x="0" y="352" width="1024" height="672" /></clipPath>
    </defs>
    <g :clip-path="`url(#${clip})`">
      <g class="st-logo-paper">
        <g transform="translate(0,1024) scale(0.1,-0.1)" fill="currentColor">
          <path d="M3830 6451 c-74 -15 -136 -66 -164 -133 l-16 -37 0 -1761 0 -1761 15 -29 c15 -29 43 -50 65 -50 6 0 89 73 183 163 223 211 231 217 273 217 52 0 61 -7 268 -201 105 -99 196 -179 202 -179 6 0 97 81 202 179 205 193 215 201 262 201 48 0 61 -10 263 -202 103 -98 193 -178 198 -178 12 0 65 47 273 242 l146 138 44 0 44 0 55 -47 c30 -27 123 -112 205 -190 83 -79 156 -143 162 -143 22 0 50 21 65 50 l15 29 0 1761 0 1761 -14 33 c-21 49 -71 102 -119 122 l-42 19 -1275 1 c-701 1 -1291 -1 -1310 -5z m1314 -1514 c9 -7 34 -51 55 -99 86 -194 146 -255 336 -342 129 -60 127 -83 -11 -151 -195 -96 -237 -138 -319 -320 -53 -117 -51 -115 -85 -115 l-30 0 -50 107 c-94 199 -137 242 -334 333 -133 62 -129 83 28 160 180 89 227 141 315 340 41 94 60 112 95 87z" />
        </g>
      </g>
    </g>
    <g transform="translate(0,1024) scale(0.1,-0.1)" fill="currentColor">
      <path d="M2652 7530 c-228 -60 -414 -247 -472 -476 -92 -358 122 -724 476 -814 l77 -20 303 0 c231 0 305 3 311 13 4 6 8 77 9 157 l1 145 23 48 c28 59 80 103 144 122 l50 15 1546 0 1546 0 50 -15 c64 -19 116 -63 146 -122 l23 -48 5 -155 5 -155 330 0 330 0 78 28 c468 165 603 753 252 1103 -94 94 -202 154 -320 179 l-70 15 -2385 -1 -2385 0 -73 -19z" />
    </g>
  </svg>
</template>

<style scoped>
.st-logo { display: block; flex-shrink: 0; overflow: visible; }
.st-logo-paper { transform-box: view-box; }
.is-print .st-logo-paper {
  animation: logoFeed 1.05s var(--d, 0ms) both;
}
/* Avance a tirones: cada tramo arranca rápido y frena, con pausas cortas,
   como el motor paso a paso de una impresora de recibos. */
@keyframes logoFeed {
  0%   { transform: translateY(-400px); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }
  22%  { transform: translateY(-290px); }
  30%  { transform: translateY(-290px); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }
  50%  { transform: translateY(-175px); }
  57%  { transform: translateY(-175px); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }
  80%  { transform: translateY(-50px); }
  86%  { transform: translateY(-50px); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }
  100% { transform: translateY(0); }
}
</style>
