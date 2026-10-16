<script setup lang="ts">
import { trasPintar } from '~/composables/useTema'
// Contador mecánico: cada dígito es un rodillo 0–9 que gira hasta su valor,
// de derecha a izquierda, como el visor de una caja registradora.
// Rueda al cambiar el valor; al montar solo rueda la primera vez por `id`
// (las visitas siguientes muestran el número quieto).
import { formatMoney } from '~/composables/useDatos'

interface Props {
  value: number
  code?: string
  id?: string
  fmt?: (v: number) => string   // formato propio (conteos, montos cortos)
  rodar?: boolean               // rueda desde 0 cada vez que se monta
}
const props = withDefaults(defineProps<Props>(), { code: 'COP', id: '' })

const vistos = useState<Record<string, boolean>>('odometer-seen', () => ({}))
// Sin espacio tras el símbolo: un espacio suelto en una caja inline se colapsa.
const texto = computed(() => (props.fmt ? props.fmt(props.value).replace(/\s/g, '\u00A0') : formatMoney(props.value, props.code).replace(/\s/g, '')))
const chars = computed(() => {
  const arr = [...texto.value]
  const n = arr.length
  // Clave por posición desde la derecha: las unidades siempre son la misma columna.
  return arr.map((c, i) => ({ c, d: /\d/.test(c) ? Number(c) : -1, k: n - i }))
})

// En el primer montaje los rodillos parten de 0 y giran al valor.
const listo = ref(!props.rodar && (!!(props.id && vistos.value[props.id]) || !props.id))
onMounted(() => {
  if (listo.value) return
  trasPintar(() => {
    listo.value = true
    if (props.id) vistos.value[props.id] = true
  })
})
</script>

<template>
  <span class="odo" :aria-label="texto" role="text">
    <span class="odo-row" aria-hidden="true">
      <template v-for="ch in chars" :key="ch.k">
        <span v-if="ch.d >= 0" class="odo-col">
          <span
            class="odo-reel"
            :style="{
              transform: `translateY(${-(listo ? ch.d : 0) * 10}%)`,
              transitionDelay: `${Math.min(ch.k, 10) * 28}ms`,
            }"
          >
            <span v-for="n in 10" :key="n">{{ n - 1 }}</span>
          </span>
        </span>
        <span v-else class="odo-sep">{{ ch.c }}</span>
      </template>
    </span>
  </span>
</template>

<style scoped>
.odo { position: relative; display: inline-flex; font-variant-numeric: tabular-nums; white-space: nowrap; line-height: 1; }
.odo-row { position: relative; display: inline-flex; }
/* Cada dígito ocupa 1.3em en el rodillo (aire entre vecinos para que no asomen
   sus puntas), y el margen negativo deja la caja en 1em como antes. */
.odo-col { display: inline-block; height: 1.3em; margin: -.15em 0; overflow: hidden; }
.odo-reel {
  display: flex; flex-direction: column;
  transition: transform .9s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}
.odo-reel > span { height: 1.3em; line-height: 1.3em; display: block; text-align: center; }
.odo-sep { display: inline-block; }
</style>
