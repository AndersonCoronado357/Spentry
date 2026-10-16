<script setup lang="ts">
definePageMeta({ layout: 'auth' })
// Es la página que ven Google y las visitas sin sesión: título descriptivo.
useHead({ title: 'Spentry — Anota tus gastos y mira a dónde va tu dinero' })

type Modo = 'iniciar' | 'crear' | 'recuperar'

const COPY: Record<Modo, { h: string[]; sub: string; cardTitle: string; cardSub: string; submit: string }> = {
  iniciar: {
    h: ['Cada gasto,', 'con su recibo.'],
    sub: 'Anota lo que gastas en segundos y mira a dónde se va tu dinero.',
    cardTitle: 'Iniciar sesión',
    cardSub: 'Qué bueno verte de nuevo.',
    submit: 'Entrar',
  },
  crear: {
    h: ['Abre tu caja,', 'empieza a anotar.'],
    sub: 'Tu cuenta llega con categorías listas para registrar el primer gasto hoy mismo.',
    cardTitle: 'Crear cuenta',
    cardSub: 'Toma menos de un minuto.',
    submit: 'Crear mi cuenta',
  },
  recuperar: {
    h: ['Recupera', 'el acceso.'],
    sub: '',
    cardTitle: 'Recupera tu acceso',
    cardSub: 'Te ayudamos a volver a tu caja.',
    submit: 'Enviar enlace',
  },
}

const modo = ref<Modo>('iniciar')
const c = computed(() => COPY[modo.value])
const nombre = ref('')
const correo = ref('')
const pass = ref('')
const error = ref('')
const cargando = ref(false)

onMounted(() => {
  const e = new URLSearchParams(window.location.search).get('error')
  if (e === 'google-nc') error.value = 'El acceso con Google aún no está configurado aquí. Entra con correo y contraseña.'
  else if (e === 'google') error.value = 'No pudimos completar el acceso con Google. Intenta de nuevo.'
})

async function enviar() {
  if (cargando.value) return
  error.value = ''
  if (modo.value === 'recuperar') { error.value = 'La recuperación por correo estará disponible pronto.'; return }
  cargando.value = true
  try {
    if (modo.value === 'crear') {
      await $fetch('/api/auth/register', { method: 'POST', body: { name: nombre.value, email: correo.value, password: pass.value } })
    } else {
      await $fetch('/api/auth/login', { method: 'POST', body: { login: correo.value, password: pass.value } })
    }
    window.location.href = '/'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.data?.message || e?.statusMessage || 'Algo salió mal'
    cargando.value = false
  }
}

// ── Cambio de modo: los bloques se deslizan a su nuevo lugar (FLIP) ──
const heroRef = ref<HTMLElement | null>(null)
const cardRef = ref<HTMLElement | null>(null)
async function cambiar(n: Modo) {
  if (n === modo.value) return
  const els = [heroRef.value, cardRef.value].filter(Boolean) as HTMLElement[]
  const antes = els.map(el => el.getBoundingClientRect())
  error.value = ''
  modo.value = n
  await nextTick()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  els.forEach((el, i) => {
    const a = antes[i]!, d = el.getBoundingClientRect()
    if (!d.width || !a.width) return
    const dx = a.left - d.left, dy = a.top - d.top
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
    el.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
      { duration: 560, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
    )
  })
}

// La tarjeta cambia de alto con suavidad (mide su contenido).
const innerRef = ref<HTMLElement | null>(null)
const alto = ref<number | null>(null)
let ro: ResizeObserver | null = null
onMounted(() => {
  ro = new ResizeObserver(() => { if (innerRef.value) alto.value = innerRef.value.offsetHeight })
  if (innerRef.value) ro.observe(innerRef.value)
})
// Al reimprimirse la tarjeta, el formulario es otro elemento: se vuelve a medir.
watch(innerRef, (el, viejo) => {
  if (viejo) ro?.unobserve(viejo)
  if (el) { ro?.observe(el); alto.value = el.offsetHeight }
})
onBeforeUnmount(() => ro?.disconnect())

const DIA = [
  { ic: 'coffee', t: 'Café', v: '$6.500' },
  { ic: 'bus', t: 'Transporte', v: '$2.950' },
  { ic: 'food', t: 'Almuerzo', v: '$18.000' },
  { ic: 'basket', t: 'Mercado', v: '$42.300' },
]
const APERTURA = [
  { ic: 'food', t: 'Comida' }, { ic: 'bus', t: 'Transporte' }, { ic: 'basket', t: 'Mercado' },
  { ic: 'bolt', t: 'Servicios' }, { ic: 'heart', t: 'Salud' }, { ic: 'house', t: 'Hogar' },
]
const PASOS = [
  { n: 1, t: 'Escribe el correo de tu cuenta' },
  { n: 2, t: 'Abre el enlace que te enviamos' },
  { n: 3, t: 'Crea una contraseña nueva' },
]
</script>

<template>
  <div :class="['login-stage', `m-${modo}`]">
    <!-- Titular + recibo (escritorio; en recuperar no hay) -->
    <div v-show="modo !== 'recuperar'" ref="heroRef" class="login-hero">
      <Transition name="swap" mode="out-in">
        <div :key="modo" class="col">
          <h1 class="st-title login-h">
            <span v-for="(l, i) in c.h" :key="i" style="display: block">{{ l }}</span>
          </h1>
          <p class="login-hsub">{{ c.sub }}</p>
        </div>
      </Transition>

      <div class="demo">
        <div class="demo-slot"><i /></div>
        <div class="demo-window">
          <!-- La clave reimprime el recibo al cambiar de modo. -->
          <div :key="modo" class="demo-feed">
            <div class="demo-paper" :style="{ transform: `rotate(${modo === 'crear' ? 2 : -2}deg)` }">
              <div class="ticket demo-ticket">
                <div class="tk-head">
                  <span class="tk-brand"><StLogo :size="16" /><span>SPENTRY</span></span>
                  <span class="tk-sub">{{ modo === 'crear' ? 'Apertura de caja · N.º 0001' : 'Tu día en recibos' }}</span>
                </div>
                <div class="tk-rule" />
                <template v-if="modo === 'crear'">
                  <div v-for="d in APERTURA" :key="d.t" class="tk-line demo-line">
                    <span class="row" style="gap: 8px"><StIcon :name="d.ic" :size="15" />{{ d.t }}</span>
                    <span class="demo-ok"><StIcon name="check" :size="13" stroke="2.6" /></span>
                  </div>
                  <div class="tk-rule" />
                  <div class="tk-total"><span>CATEGORÍAS</span><span>8</span></div>
                </template>
                <template v-else>
                  <div v-for="d in DIA" :key="d.t" class="tk-line demo-line">
                    <span class="row" style="gap: 8px"><StIcon :name="d.ic" :size="15" />{{ d.t }}</span>
                    <span>{{ d.v }}</span>
                  </div>
                  <div class="tk-rule" />
                  <div class="tk-total"><span>TOTAL</span><span>$69.750</span></div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tarjeta -->
    <div ref="cardRef" class="login-card-wrap">
      <div class="login-slot" aria-hidden="true"><i /></div>
      <div class="login-clip">
        <!-- La clave vuelve a imprimir la tarjeta desde la ranura en cada cambio de modo. -->
        <div :key="modo" class="login-card" :style="alto ? { height: alto + 'px' } : undefined">
          <form ref="innerRef" class="login-inner" @submit.prevent="enviar">
            <Transition name="swap" mode="out-in">
              <div :key="modo" class="col" style="gap: 4px; margin-bottom: 20px">
                <span class="st-title login-card-title">{{ c.cardTitle }}</span>
                <span class="muted" style="font-size: .95rem">{{ c.cardSub }}</span>
              </div>
            </Transition>

            <Transition name="swap">
              <div v-if="error" class="form-error-box">{{ error }}</div>
            </Transition>

            <!-- Recuperar: pasos -->
            <ol v-if="modo === 'recuperar'" class="steps">
              <li v-for="p in PASOS" :key="p.n"><span class="step-n">{{ p.n }}</span>{{ p.t }}</li>
            </ol>

            <div class="col" style="gap: 14px">
              <StField v-if="modo === 'crear'" v-model="nombre" label="Nombre" icon="user" placeholder="Tu nombre" autocomplete="name" />
              <StField v-model="correo" label="Correo" icon="mail" type="email" placeholder="tucorreo@ejemplo.com" autocomplete="email" />
              <div v-if="modo !== 'recuperar'" class="col" style="gap: 8px">
                <StPasswordField
                  v-model="pass"
                  label="Contraseña"
                  :placeholder="modo === 'crear' ? 'Mínimo 8 caracteres' : '········'"
                  :autocomplete="modo === 'crear' ? 'new-password' : 'current-password'"
                />
                <button v-if="modo === 'iniciar'" type="button" class="login-link" style="align-self: flex-end" @click="cambiar('recuperar')">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top: 20px" :disabled="cargando">
              <span :class="['btn-label', cargando ? 'swap' : '']">{{ cargando ? 'Un momento…' : c.submit }}</span>
            </button>

            <template v-if="modo !== 'recuperar'">
              <div class="login-or"><span>o</span></div>
              <a href="/auth/google" class="login-google">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9Z" />
                  <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2.1s.2-1.4.4-2.1V7H2a11 11 0 0 0 0 9.9L5.7 14Z" />
                  <path fill="#EA4335" d="M12 4.8c1.6 0 3 .6 4.2 1.7l3.1-3.1A11 11 0 0 0 2 7l3.7 2.8C6.6 6.8 9.1 4.8 12 4.8Z" />
                </svg>
                Continuar con Google
              </a>
            </template>

            <div class="login-foot">
              <template v-if="modo === 'iniciar'">
                <span class="faint">¿No tienes cuenta?</span>
                <button type="button" class="login-link" @click="cambiar('crear')">Regístrate</button>
              </template>
              <template v-else-if="modo === 'crear'">
                <span class="faint">¿Ya tienes cuenta?</span>
                <button type="button" class="login-link" @click="cambiar('iniciar')">Inicia sesión</button>
              </template>
              <template v-else>
                <button type="button" class="login-link" @click="cambiar('iniciar')">
                  Volver a iniciar sesión
                </button>
              </template>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
