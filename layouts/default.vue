<script setup lang="ts">
// Shell de Spentry. Sidebar (≥900px) y tabbar (<900px) viven ambos en el DOM;
// el CSS decide cuál se ve. El indicador activo de cada uno se desliza entre
// opciones (transform), en vez de aparecer de golpe.
const ruta = useRoute()
const router = useRouter()
const { usuario } = useDatos()
const { reg, abrir } = useRegistro()
const { detalleId } = useDetalle()
const registrar = () => abrir()

const NAV = [
  { id: 'inicio', to: '/',             label: 'Inicio',       icon: 'home' },
  { id: 'movs',   to: '/movimientos',  label: 'Movimientos',  icon: 'receipt' },
  { id: 'stats',  to: '/estadisticas', label: 'Estadísticas', icon: 'chart' },
  { id: 'cats',   to: '/categorias',   label: 'Categorías',   icon: 'tag' },
] as const

const activo = computed(() => {
  const p = ruta.path
  if (p === '/') return 'inicio'
  return NAV.find(n => n.to !== '/' && p.startsWith(n.to))?.id ?? null
})
const ajustesActivo = computed(() => ruta.path.startsWith('/ajustes'))

// Indicadores deslizantes.
// Las refs en v-for sobre NuxtLink son instancias de componente: se usa su $el.
const sideRefs: any[] = []
const tabRefs: any[] = []
const elDe = (r: any): HTMLElement | undefined => r?.$el ?? r
const sideInd = ref<{ y: number; h: number } | null>(null)
const tabInd = ref<{ x: number; w: number } | null>(null)
function medir() {
  const i = NAV.findIndex(n => n.id === activo.value)
  const s = elDe(sideRefs[i])
  sideInd.value = s ? { y: s.offsetTop, h: s.offsetHeight } : null
  const t = elDe(tabRefs[i])
  tabInd.value = t ? { x: t.offsetLeft + t.offsetWidth / 2, w: t.offsetWidth } : null
}
watch(activo, () => nextTick(medir))
onMounted(() => {
  nextTick(medir)
  window.addEventListener('resize', medir)
  window.addEventListener('keydown', atajo)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', medir)
  window.removeEventListener('keydown', atajo)
})

// Atajo de teclado: N abre la caja (sin animación, por venir del teclado).
function atajo(e: KeyboardEvent) {
  const t = e.target as HTMLElement
  if (e.metaKey || e.ctrlKey || e.altKey || reg.abierto || detalleId.value) return
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); abrir({ instantaneo: true }) }
}

// ?registrar=1 (atajo de la PWA o toque en el recordatorio) abre la caja.
watch(() => ruta.query.registrar, (v) => {
  if (!v) return
  router.replace({ query: { ...ruta.query, registrar: undefined } })
  setTimeout(() => abrir(), 250)
}, { immediate: true })
</script>

<template>
  <div class="st-root">
    <div class="app-shell">
      <!-- Sidebar (≥900px) -->
      <aside class="sidebar">
        <NuxtLink to="/" class="sidebar-brand" aria-label="Spentry, inicio">
          <StBrandmark :size="22" />
        </NuxtLink>

        <nav class="sidebar-nav">
          <span
            v-if="sideInd"
            class="nav-ind"
            :style="{ height: sideInd.h + 'px', transform: `translateY(${sideInd.y}px)` }"
          />
          <NuxtLink
            v-for="n in NAV"
            :key="n.id"
            :ref="(r) => { sideRefs[NAV.findIndex(x => x.id === n.id)] = r }"
            :to="n.to"
            :class="['nav-item', activo === n.id ? 'on' : '']"
          >
            <StIcon :name="n.icon" :size="20" />
            <span>{{ n.label }}</span>
          </NuxtLink>
        </nav>

        <div class="sidebar-foot">
          <button type="button" class="btn btn-primary btn-block side-cta" @click="registrar()">
            <StIcon name="plus" :size="18" />
            Registrar gasto
          </button>

          <NuxtLink to="/ajustes" :class="['user-chip', ajustesActivo ? 'on' : '']">
            <span class="user-av">
              <img v-if="usuario.photo" :src="usuario.photo" alt="" />
              <template v-else>{{ usuario.name.charAt(0) }}</template>
            </span>
            <span class="col grow" style="gap: 1px; align-items: flex-start; min-width: 0">
              <span class="ellipsis" style="font-weight: 600; font-size: .88rem; max-width: 100%">{{ usuario.name }}</span>
              <span class="faint" style="font-size: .76rem">Ajustes y perfil</span>
            </span>
            <StIcon name="settings" :size="17" style="color: var(--text3)" />
          </NuxtLink>
        </div>
      </aside>

      <main class="app-main">
        <slot />
      </main>

      <!-- Tabbar (<900px) -->
      <nav class="tabbar" aria-label="Navegación principal">
        <span
          v-if="tabInd"
          class="tab-ind"
          :style="{ transform: `translateX(${tabInd.x}px) translateX(-50%)` }"
        />
        <template v-for="(n, i) in NAV" :key="n.id">
          <button v-if="i === 2" type="button" class="fab" aria-label="Registrar gasto" @click="registrar()">
            <StIcon name="plus" :size="26" stroke="2" />
          </button>
          <NuxtLink
            :ref="(r) => { tabRefs[i] = r }"
            :to="n.to"
            :class="['tab-btn', activo === n.id ? 'on' : '']"
            :aria-label="n.label"
          >
            <StIcon :name="n.icon" :size="24" />
            <span>{{ n.label }}</span>
          </NuxtLink>
        </template>
      </nav>
    </div>

    <StRegistro />
    <StDetalle />
    <StToaster />
  </div>
</template>
