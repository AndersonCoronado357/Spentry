<script setup lang="ts">
import type { TemaPref } from '~/composables/useTema'
import { CURRENCIES, symbolOf, formatShort, folioStr, isoD, catPorId, hoy, inMonth, total } from '~/composables/useDatos'

useHead({ title: 'Ajustes · Spentry' })

const { usuario, moneda, budget, remindDaily, remindHour, hasPassword, gastos, categorias } = useDatos()
const totalMes = computed(() => total(inMonth(gastos.value, hoy().getFullYear(), hoy().getMonth()), moneda.value))
const { pref, aplicar } = useTema()
const { mostrar } = useToast()
const push = usePush()

// ── Perfil / foto ──
const drag = ref(false)
const fileRef = ref<HTMLInputElement | null>(null)
const cropFile = ref<File | null>(null)
function pedirRecorte(file: File | null | undefined) {
  if (!file || !file.type.startsWith('image/')) return
  cropFile.value = file
}
function onDrop(e: DragEvent) { e.preventDefault(); drag.value = false; pedirRecorte(e.dataTransfer?.files[0]) }
function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  pedirRecorte(input.files?.[0])
  input.value = ''
}
function fotoRecortada(dataUrl: string) { usuario.value.photo = dataUrl; cropFile.value = null; mostrar({ title: 'Foto actualizada', icon: 'check' }) }
function quitarFoto() { usuario.value.photo = '' }

// ── Tema ──
const temaOpts = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Oscuro', icon: 'moon' },
  { value: 'system', label: 'Sistema', icon: 'monitor' },
]
function elegirTema(v: string | number, e: MouseEvent) { aplicar(v as TemaPref, { x: e.clientX, y: e.clientY }) }

// ── Moneda / presupuesto ──
const monedaOpts = CURRENCIES.map(c => ({ value: c.code, label: `${c.label} (${c.code})` }))
const budgetTxt = computed(() => (budget.value ? budget.value.toLocaleString('es-CO') : ''))
// Solo dígitos: las letras ni siquiera llegan a escribirse, y lo pegado se limpia.
function soloDigitos(e: InputEvent) { if (e.data && /\D/.test(e.data)) e.preventDefault() }
function onBudget(e: Event) {
  const el = e.target as HTMLInputElement
  budget.value = Number(el.value.replace(/\D/g, '').slice(0, 12)) || 0
  if (el.value !== budgetTxt.value) el.value = budgetTxt.value
}

// ── Recordatorio ──
const horaOpts = [18, 19, 20, 21, 22].map(h => ({ value: h, label: `${h > 12 ? h - 12 : h}:00 p. m.` }))

// ── Contraseña (bloque que se despliega en línea) ──
const passAbierto = ref(false)
function alternarPass() {
  passAbierto.value = !passAbierto.value
  passError.value = ''
  if (!passAbierto.value) passActual.value = passNueva.value = passConfirma.value = ''
}
const passActual = ref('')
const passNueva = ref('')
const passConfirma = ref('')
const passError = ref('')
const passOk = ref(false)
const passCargando = ref(false)
async function guardarPass() {
  passError.value = ''
  passOk.value = false
  if (hasPassword.value && !passActual.value) { passError.value = 'Escribe tu contraseña actual.'; return }
  if (passNueva.value.length < 8) { passError.value = 'La nueva contraseña debe tener al menos 8 caracteres.'; return }
  if (passNueva.value !== passConfirma.value) { passError.value = 'Las contraseñas no coinciden.'; return }
  passCargando.value = true
  try {
    await $fetch('/api/auth/password', { method: 'POST', body: { current: passActual.value, next: passNueva.value } })
    passActual.value = passNueva.value = passConfirma.value = ''
    hasPassword.value = true
    passOk.value = true
    passAbierto.value = false
    mostrar({ title: 'Contraseña actualizada', icon: 'lock' })
  } catch (e: any) {
    passError.value = e?.data?.statusMessage || e?.statusMessage || 'No se pudo actualizar.'
  } finally {
    passCargando.value = false
  }
}

// ── Datos ──
function exportarCSV() {
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`
  const filas = [['Folio', 'Fecha', 'Categoría', 'Nota', 'Monto', 'Moneda']]
  for (const g of [...gastos.value].sort((a, b) => a.date.getTime() - b.date.getTime())) {
    filas.push([folioStr(g.folio), isoD(g.date)!, catPorId(g.category).label, g.note, String(g.amount), g.currency])
  }
  const csv = '﻿' + filas.map(f => f.map(esc).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `spentry-gastos-${isoD(new Date())}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  mostrar({ title: 'CSV descargado', body: `${gastos.value.length} recibos`, icon: 'download' })
}

async function cerrarSesion() {
  try { await $fetch('/api/auth/logout', { method: 'POST' }) } catch { /* noop */ }
  window.location.href = '/login'
}
// Cifras del perfil: ruedan como el contador de la caja al entrar.
const fmtNum = (v: number) => v.toLocaleString('es-CO')
const fmtCorto = (v: number) => formatShort(v, moneda.value)
</script>

<template>
  <div class="screen settings">
    <header class="page-head">
      <div class="col grow" style="min-width: 0">
        <span class="eyebrow">Tu cuenta</span>
        <h1 class="page-title">Ajustes</h1>
      </div>
    </header>

    <div class="settings-grid">
      <!-- Perfil: tarjeta a todo el alto -->
      <section class="card profile-card">
        <div class="profile-top">
          <div
            :class="['avatar-drop', drag ? 'drag' : '']"
            role="button"
            tabindex="0"
            aria-label="Cambiar foto de perfil"
            @click="fileRef?.click()"
            @keydown.enter="fileRef?.click()"
            @dragover.prevent="drag = true"
            @dragleave="drag = false"
            @drop="onDrop"
          >
            <img v-if="usuario.photo" :src="usuario.photo" alt="" />
            <span v-else class="avatar-initial st-title">{{ usuario.name.charAt(0) || '?' }}</span>
            <span class="avatar-hover" aria-hidden="true">
              <StIcon name="image" :size="26" />
              <span>{{ usuario.photo ? 'Cambiar foto' : 'Subir foto' }}</span>
            </span>
            <span class="avatar-edit"><StIcon name="image" :size="16" /></span>
            <input ref="fileRef" type="file" accept="image/*" hidden @change="onFile" />
          </div>
          <span class="st-title profile-name ellipsis">{{ usuario.name || 'Sin nombre' }}</span>
          <span class="faint ellipsis" style="font-weight: 600; max-width: 100%">{{ usuario.email }}</span>
          <button v-if="usuario.photo" type="button" class="link-quiet" @click.stop="quitarFoto">
            <StIcon name="trash" :size="14" />Quitar foto
          </button>
        </div>

        <div class="profile-stats">
          <div><b class="num"><StOdometer :value="gastos.length" :fmt="fmtNum" rodar /></b><span class="faint">recibos</span></div>
          <div><b class="num"><StOdometer :value="categorias.length" :fmt="fmtNum" rodar /></b><span class="faint">categorías</span></div>
          <div><b class="num"><StOdometer :value="totalMes" :fmt="fmtCorto" rodar /></b><span class="faint">este mes</span></div>
        </div>

        <div class="col" style="gap: 14px">
          <StField v-model="usuario.name" label="Nombre" icon="user" :maxlength="60" />
          <div class="col">
            <span class="field-label">Correo</span>
            <div class="readonly-box">
              <StIcon name="mail" :size="18" style="color: var(--text3); flex-shrink: 0" />
              <span class="ellipsis" style="flex: 1">{{ usuario.email }}</span>
              <StIcon name="lock" :size="15" style="color: var(--text3); flex-shrink: 0" />
            </div>
          </div>
        </div>

        <button class="btn btn-danger btn-block btn-lg profile-logout" @click="cerrarSesion">
          <StIcon name="logout" :size="17" />Cerrar sesión
        </button>
      </section>

      <div class="settings-col">
        <!-- Preferencias -->
        <section class="card">
          <span class="panel-title" style="display: block; margin-bottom: 6px">Preferencias</span>
          <div class="set-list">
            <div class="set-row wrap">
              <span class="set-ic"><StIcon name="sun" :size="19" /></span>
              <div class="col grow" style="gap: 2px">
                <span class="set-title">Tema</span>
                <span class="faint" style="font-size: .85rem">Claro, oscuro o el del sistema</span>
              </div>
              <StSegmented :model-value="pref" :options="temaOpts" aria-label="Tema" @pick="elegirTema" />
            </div>
            <hr class="hair" />
            <div class="set-row">
              <span class="set-ic"><StIcon name="wallet" :size="19" /></span>
              <div class="col grow" style="gap: 2px">
                <span class="set-title">Moneda</span>
                <span class="faint" style="font-size: .85rem">Para nuevos gastos y totales</span>
              </div>
              <div style="width: min(240px, 48%)"><StSelect v-model="moneda" :options="monedaOpts" /></div>
            </div>
            <hr class="hair" />
            <div class="set-row">
              <span class="set-ic"><StIcon name="target" :size="19" /></span>
              <div class="col grow" style="gap: 2px">
                <span class="set-title">Presupuesto mensual</span>
                <span class="faint" style="font-size: .85rem">{{ budget ? 'Se muestra en Inicio' : 'Opcional' }}</span>
              </div>
              <div style="width: min(200px, 44%)">
                <label class="input-wrap">
                  <span class="input-icon l" style="font-weight: 700">{{ symbolOf(moneda) }}</span>
                  <input :value="budgetTxt" class="input has-icon-l num" inputmode="numeric" placeholder="Sin presupuesto" aria-label="Presupuesto mensual" @beforeinput="soloDigitos" @input="onBudget" />
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Recordatorio -->
        <section class="card">
          <span class="panel-title" style="display: block; margin-bottom: 6px">Recordatorio</span>
          <div class="set-list">
            <div class="set-row">
              <span class="set-ic"><StIcon name="bell" :size="19" /></span>
              <div class="col grow" style="gap: 2px">
                <span class="set-title">Avisarme para anotar</span>
                <span class="faint" style="font-size: .85rem">
                  {{ push.soportado.value ? 'Una notificación al cierre del día' : 'No disponible en este navegador' }}
                </span>
                <span v-if="push.error.value" style="font-size: .82rem; color: var(--danger)">{{ push.error.value }}</span>
              </div>
              <StSwitch
                :model-value="push.activo.value && remindDaily"
                :disabled="!push.soportado.value || push.ocupado.value"
                @update:model-value="async v => { await push.alternar(v); remindDaily = v && push.activo.value }"
              />
            </div>
            <hr class="hair" />
            <div class="set-row">
              <span class="set-ic"><StIcon name="clock" :size="19" /></span>
              <div class="col grow" style="gap: 2px">
                <span class="set-title">Hora del aviso</span>
                <span class="faint" style="font-size: .85rem">Hora de Colombia</span>
              </div>
              <div style="width: min(180px, 44%)"><StSelect v-model="remindHour" :options="horaOpts" /></div>
            </div>
          </div>
        </section>

        <!-- Contraseña -->
        <section class="card">
          <div class="set-row" style="padding: 0">
            <span class="set-ic"><StIcon name="lock" :size="19" /></span>
            <div class="col grow" style="gap: 2px; min-width: 0">
              <span class="set-title">Contraseña</span>
              <span class="faint" style="font-size: .85rem">
                {{ hasPassword ? 'Cámbiala cuando quieras' : 'Tu cuenta entra con Google. Puedes crear una contraseña.' }}
              </span>
            </div>
            <button type="button" :class="['btn', passAbierto ? 'btn-quiet' : 'btn-ghost']" @click="alternarPass">
              {{ passAbierto ? 'Cancelar' : hasPassword ? 'Cambiar' : 'Crear' }}
            </button>
          </div>
          <div :class="['expand', passAbierto ? 'open' : '']">
            <div class="expand-inner">
              <div class="pass-form">
                <StPasswordField v-if="hasPassword" v-model="passActual" label="Contraseña actual" placeholder="········" autocomplete="current-password" />
                <div class="form-row-2">
                  <StPasswordField v-model="passNueva" label="Nueva contraseña" placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
                  <StPasswordField v-model="passConfirma" label="Repítela" placeholder="········" autocomplete="new-password" />
                </div>
                <p v-if="passError" class="form-error">{{ passError }}</p>
                <button type="button" class="btn btn-primary btn-block" :disabled="passCargando" @click="guardarPass">
                  <span :class="['btn-label', passCargando ? 'swap' : '']">{{ passCargando ? 'Guardando…' : 'Guardar contraseña' }}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Datos -->
        <section class="card">
          <div class="set-row" style="padding: 0">
            <span class="set-ic"><StIcon name="download" :size="19" /></span>
            <div class="col grow" style="gap: 2px; min-width: 0">
              <span class="set-title">Tus datos</span>
              <span class="faint" style="font-size: .85rem">Descarga todos tus recibos en un archivo CSV</span>
            </div>
            <button type="button" class="btn btn-ghost" :disabled="!gastos.length" @click="exportarCSV">Exportar</button>
          </div>
        </section>
      </div>
    </div>

    <StPhotoCrop v-if="cropFile" :file="cropFile" @done="fotoRecortada" @cancel="cropFile = null" />
  </div>
</template>
