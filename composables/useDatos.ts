import type { Gasto, Categoria, MonedaInfo, Fijo } from '~/types/gasto'

// ── Monedas ────────────────────────────────────────────────────
const RATE_TO_COP: Record<string, number> = {
  COP: 1, USD: 4100, EUR: 4450, MXN: 235, PEN: 1100, CLP: 4.4,
}

export const CURRENCIES: MonedaInfo[] = [
  { code: 'COP', label: 'Peso colombiano', symbol: '$' },
  { code: 'USD', label: 'Dólar',           symbol: 'US$' },
  { code: 'EUR', label: 'Euro',            symbol: '€' },
  { code: 'MXN', label: 'Peso mexicano',   symbol: 'MX$' },
  { code: 'PEN', label: 'Sol peruano',     symbol: 'S/' },
  { code: 'CLP', label: 'Peso chileno',    symbol: 'CLP$' },
]

export function convert(amount: number, from: string, to: string): number {
  if (from === to) return amount
  const cop = amount * (RATE_TO_COP[from] ?? 1)
  return cop / (RATE_TO_COP[to] ?? 1)
}

export function formatMoney(amount: number, code = 'COP'): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: code,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(Math.round(amount))
  } catch {
    return '$' + Math.round(amount).toLocaleString('es-CO')
  }
}
// Versión compacta para ejes y etiquetas pequeñas: $1,2 M · $350 mil.
export function formatShort(amount: number, code = 'COP'): string {
  const sym = CURRENCIES.find(c => c.code === code)?.symbol ?? '$'
  const a = Math.abs(amount)
  if (a >= 1_000_000) return `${sym}${(amount / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: a < 10_000_000 ? 2 : 1 })} M`
  if (a >= 10_000) return `${sym}${Math.round(amount / 1000).toLocaleString('es-CO')} mil`
  return `${sym}${Math.round(amount).toLocaleString('es-CO')}`
}
export function symbolOf(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? '$'
}

// ── Colores de categoría ───────────────────────────────────────
// Paleta validada (claro) y sus pasos propios para oscuro (no un simple
// oscurecido): misma identidad, luminosidad dentro de la banda de cada fondo.
export const PALETA = [
  '#76B83F', '#7D62CC', '#E5A136', '#3B78C9', '#E4839A', '#147A69',
  '#CDA43C', '#B0509E', '#C8643F', '#2E95C0', '#8C9A2C', '#6E7FD6',
]
const PALETA_OSCURO: Record<string, string> = {
  '#76B83F': '#67A334', '#7D62CC': '#8C74D8', '#E5A136': '#BF8526', '#3B78C9': '#4A86D4',
  '#E4839A': '#B85471', '#147A69': '#2FA892', '#CDA43C': '#AE8B2B', '#B0509E': '#BC5FAB',
  '#C8643F': '#C46A45', '#2E95C0': '#3E9BC7', '#8C9A2C': '#8E9C32', '#6E7FD6': '#7A8ADA',
}
/** Color de una categoría para marcas de gráfico según el tema activo. */
export function chartColor(c: string, tema: 'light' | 'dark'): string {
  return tema === 'dark' ? (PALETA_OSCURO[c.toUpperCase()] ?? c) : c
}

// ── Contraste para cualquier color (también los personalizados) ──
type RGB = [number, number, number]
function rgbDe(hex: string): RGB {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(x => x + x).join('')
  const n = parseInt(h.slice(0, 6), 16) || 0
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function luz([r, g, b]: RGB): number {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const contraste = (a: RGB, b: RGB) => { const x = luz(a), y = luz(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
const mezcla = (a: RGB, b: RGB, k: number): RGB => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k)) as RGB
const aHex = (c: RGB) => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')
const TINTA_OSCURA: RGB = [21, 36, 10]

/** Tinta legible encima de un relleno del color (icono elegido, muestra activa). */
export function tintaSobre(c: string): string {
  const rgb = rgbDe(c)
  return contraste(rgb, TINTA_OSCURA) >= contraste(rgb, [255, 255, 255]) ? '#15240A' : '#FFFFFF'
}
/** Color del icono sobre su círculo suave: el tono de siempre, y solo si queda
 *  poco visible (colores muy oscuros o muy claros) se aclara u oscurece lo justo. */
export function tintaIcono(c: string, tema: 'light' | 'dark'): string {
  const rgb = rgbDe(c)
  const oscuro = tema === 'dark'
  const hacia: RGB = oscuro ? [255, 255, 255] : [24, 24, 27]
  const fondo = mezcla(oscuro ? [23, 25, 23] : [255, 255, 255], rgb, 0.18)
  for (let k = oscuro ? 0.2 : 0.3; k < 1; k += 0.05) {
    const m = mezcla(rgb, hacia, k)
    if (contraste(m, fondo) >= 3.4) return aHex(m)
  }
  return aHex(hacia)
}
export const ICONOS_CAT = [
  'food', 'coffee', 'basket', 'bus', 'car', 'fuel', 'house', 'bolt', 'wifi', 'phone',
  'heart', 'pill', 'dumbbell', 'scissors', 'ticket', 'tv', 'music', 'game', 'drink',
  'bag', 'shirt', 'gift', 'store', 'book', 'school', 'paw', 'plane', 'tool', 'wallet', 'dots',
]

// ── Fechas ─────────────────────────────────────────────────────
export const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
export const MESES_COR = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
export const DIAS_MIN = ['lu','ma','mi','ju','vi','sá','do']
export const DIAS_COR = ['dom','lun','mar','mié','jue','vie','sáb']

/** "Hoy" fresco en cada llamada (la app puede quedar abierta pasada la medianoche). */
export function hoy(): Date { return new Date() }
export function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export function addDays(date: Date, n: number): Date { const d = new Date(date); d.setDate(d.getDate() + n); return d }
export function sameDay(a?: Date | null, b?: Date | null): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000)
}
export function fmtDate(date: Date | null | undefined, opts?: { long?: boolean; weekday?: boolean }): string {
  if (!date) return ''
  const d = new Date(date)
  if (opts?.long) return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
  return `${opts?.weekday ? DIAS_COR[d.getDay()] + ' ' : ''}${d.getDate()} ${MESES_COR[d.getMonth()]}`
}
/** Etiqueta humana de un día: Hoy · Ayer · mié 14 oct. */
export function dayLabel(date: Date): string {
  const n = daysBetween(date, hoy())
  if (n === 0) return 'Hoy'
  if (n === 1) return 'Ayer'
  return fmtDate(date, { weekday: true })
}
export function fmtTime(d: Date): string {
  return d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true })
}
export function isoD(d: Date | null | undefined): string | null {
  if (!d) return null
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
// 'YYYY-MM-DD' a Date al mediodía (evita saltos de zona horaria).
function parseD(s: string | null | undefined): Date | null {
  return s ? new Date(String(s).slice(0, 10) + 'T12:00:00') : null
}
function parseDT(s: string | null | undefined): Date {
  if (!s) return new Date()
  const d = new Date(String(s).replace(' ', 'T'))
  return isNaN(d.getTime()) ? new Date() : d
}
export function monthKey(y: number, m: number) { return `${y}-${m}` }

// ── Quincenas: la app se ve por quincena (del 1 al 15 y del 16 a fin de mes) ──
export interface Periodo { y: number; m: number; q: number }   // q: 0 = del 1 al 15 · 1 = del 16 a fin de mes
export function diasDelMes(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
export function periodoDe(d: Date): Periodo { return { y: d.getFullYear(), m: d.getMonth(), q: d.getDate() <= 15 ? 0 : 1 } }
export function rangoDe(p: Periodo) { return { ini: p.q ? 16 : 1, fin: p.q ? diasDelMes(p.y, p.m) : 15 } }
export const ordenPeriodo = (p: Periodo) => p.y * 24 + p.m * 2 + p.q
export const mismoPeriodo = (a: Periodo, b: Periodo) => ordenPeriodo(a) === ordenPeriodo(b)
export function moverPeriodo(p: Periodo, delta: number): Periodo {
  const i = ordenPeriodo(p) + delta
  return { y: Math.floor(i / 24), m: Math.floor((i % 24) / 2), q: i % 2 }
}
/** "16–31 oct" (corto) · "16–31 de octubre" */
export function etiquetaPeriodo(p: Periodo, corto = false): string {
  const { ini, fin } = rangoDe(p)
  return corto ? `${ini}–${fin} ${MESES_COR[p.m]}` : `${ini}–${fin} de ${MESES[p.m]}`
}
/** Primer día de la quincena: ahí queda el recibo de cada gasto fijo. */
export function inicioPeriodo(p: Periodo): Date { return new Date(p.y, p.m, rangoDe(p).ini, 12) }
/** "del 16 al 31 de octubre" */
export function rangoTexto(p: Periodo): string {
  const { ini, fin } = rangoDe(p)
  return `del ${ini} al ${fin} de ${MESES[p.m]}`
}
export function folioStr(n: number): string { return String(n).padStart(4, '0') }

// ── Estado (SPA: refs de módulo, por navegador). Se llena desde /api/data. ──
const _gastos = ref<Gasto[]>([])
const _categorias = ref<Categoria[]>([])
const _user = ref({ name: '', email: '', photo: null as string | null })
const _moneda = ref('COP')
const _budget = ref(0)
const _fijos = ref<Fijo[]>([])
const _remindDaily = ref(true)
const _remindHour = ref(20)
const _hasPassword = ref(true)
export const _loaded = ref(false)

export function catPorId(id: string): Categoria {
  return _categorias.value.find(c => c.id === id)
    ?? { id, label: id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Sin categoría', icon: 'tag', color: '#8B9480', sort: 999 }
}

// ── Estadísticas ───────────────────────────────────────────────
export function valueIn(g: Gasto, code: string): number { return convert(g.amount, g.currency, code) }
export function total(list: Gasto[], code: string): number {
  return list.reduce((s, g) => s + valueIn(g, code), 0)
}
export function onDay(list: Gasto[], d: Date): Gasto[] { return list.filter(g => sameDay(g.date, d)) }
/** Sin los recibos de gastos fijos: lo del día a día (un fijo es de la quincena, no de un día). */
export function sinFijos(list: Gasto[]): Gasto[] { return list.filter(g => !g.fijo) }
export function inPeriodo(list: Gasto[], p: Periodo): Gasto[] {
  const { ini, fin } = rangoDe(p)
  return list.filter(g => g.date.getFullYear() === p.y && g.date.getMonth() === p.m && g.date.getDate() >= ini && g.date.getDate() <= fin)
}

/** Serie diaria de una quincena: [{ d: día del mes, v }] */
export function dailySeriesPeriodo(list: Gasto[], p: Periodo, code: string) {
  const { ini, fin } = rangoDe(p)
  const out = Array.from({ length: fin - ini + 1 }, (_, i) => ({ d: ini + i, v: 0, date: new Date(p.y, p.m, ini + i, 12) }))
  for (const g of inPeriodo(list, p)) out[g.date.getDate() - ini]!.v += valueIn(g, code)
  return out
}
/** Totales de las últimas `n` quincenas hasta `p` (incluida). */
export function lastPeriodos(list: Gasto[], n: number, code: string, p: Periodo) {
  return Array.from({ length: n }, (_, i) => {
    const x = moverPeriodo(p, i - n + 1)
    return { ...x, label: `${x.q ? '2.ª' : '1.ª'} ${MESES_COR[x.m]}`, v: total(inPeriodo(list, x), code) }
  })
}
/** Últimos `n` días hasta `ref` (incluido). */
export function lastDays(list: Gasto[], n: number, code: string, ref = hoy()) {
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(ref, i - n + 1)
    return { date: d, v: total(onDay(list, d), code) }
  })
}
export function byCategory(list: Gasto[], code: string) {
  const map: Record<string, { value: number; count: number }> = {}
  for (const g of list) {
    const e = (map[g.category] ||= { value: 0, count: 0 })
    e.value += valueIn(g, code)
    e.count++
  }
  return Object.entries(map)
    .map(([id, e]) => ({ ...catPorId(id), id, value: e.value, count: e.count }))
    .sort((a, b) => b.value - a.value)
}
/** Agrupa por día (orden descendente) para la cinta de movimientos. */
export function groupByDay(list: Gasto[], code: string) {
  const groups: { key: string; date: Date; items: Gasto[]; total: number }[] = []
  const sorted = [...list].sort((a, b) => b.date.getTime() - a.date.getTime() || b.createdAt.getTime() - a.createdAt.getTime())
  for (const g of sorted) {
    const key = isoD(g.date)!
    let grp = groups[groups.length - 1]
    if (!grp || grp.key !== key) { grp = { key, date: g.date, items: [], total: 0 }; groups.push(grp) }
    grp.items.push(g)
    grp.total += valueIn(g, code)
  }
  return groups
}

// ── Hidratación / serialización ───────────────────────────────
function hydrate(a: any): Gasto {
  return {
    id: a.id,
    folio: Number(a.folio) || 0,
    amount: Number(a.amount),
    currency: a.currency || 'COP',
    category: a.category,
    note: a.note ?? '',
    date: parseD(a.date) ?? new Date(),
    createdAt: parseDT(a.createdAt),
    fijo: a.fixedId ?? null,
  }
}
function serialize(g: Partial<Gasto>): any {
  const out: any = { ...g }
  if (g.date) out.date = isoD(g.date)
  if ('fijo' in out) { out.fixedId = out.fijo ?? null; delete out.fijo }
  delete out.createdAt
  return out
}

export async function cargarDatos(): Promise<void> {
  try {
    // El día local define la quincena en curso: hasta ahí deja su recibo cada fijo.
    const res: any = await $fetch('/api/data', { query: { hoy: isoD(hoy()) } })
    _gastos.value = (res.gastos || []).map(hydrate)
    _categorias.value = res.categorias || []
    _fijos.value = (res.fijos || []).map((f: any) => ({ id: f.id, label: f.label, amount: Number(f.amount), currency: f.currency, category: f.category, sort: Number(f.sort) }))
    _user.value = { name: res.perfil?.name ?? '', email: res.perfil?.email ?? '', photo: res.perfil?.photo ?? null }
    _moneda.value = res.perfil?.moneda ?? 'COP'
    _budget.value = Number(res.perfil?.budget ?? 0)
    _remindDaily.value = res.perfil?.remindDaily ?? true
    _remindHour.value = Number(res.perfil?.remindHour ?? 20)
    _hasPassword.value = res.perfil?.hasPassword ?? true
    _loaded.value = true
  } catch {
    /* sin sesión u error: deja el estado vacío */
  }
}

export async function guardarPerfil(patch: Record<string, unknown>): Promise<void> {
  try { await $fetch('/api/profile', { method: 'PATCH', body: patch }) } catch { /* noop */ }
}

const bg = (p: Promise<unknown>) => { p.catch(() => {}) }
export const nuevoId = () => 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export function useDatos() {
  function porId(id: string) { return _gastos.value.find(g => g.id === id) }
  function siguienteFolio() { return _gastos.value.reduce((m, g) => Math.max(m, g.folio), 0) + 1 }

  /** Crea el gasto de forma optimista y lo reemplaza con la versión del servidor. */
  function crear(g: Omit<Gasto, 'folio' | 'createdAt'> & { folio?: number; createdAt?: Date }): Gasto {
    const nuevo: Gasto = { folio: siguienteFolio(), createdAt: new Date(), ...g } as Gasto
    _gastos.value = [nuevo, ..._gastos.value]
    bg(
      $fetch<{ gasto: any }>('/api/gastos', { method: 'POST', body: serialize(nuevo) }).then((r) => {
        const i = _gastos.value.findIndex(x => x.id === nuevo.id)
        if (i >= 0 && r?.gasto) _gastos.value[i] = hydrate(r.gasto)
      })
    )
    return nuevo
  }
  function actualizar(id: string, patch: Partial<Gasto>) {
    const i = _gastos.value.findIndex(g => g.id === id)
    if (i >= 0) _gastos.value[i] = { ...(_gastos.value[i] as Gasto), ...patch }
    bg($fetch(`/api/gastos/${id}`, { method: 'PATCH', body: serialize(patch) }))
  }
  /** Borra y devuelve el gasto (para poder deshacer). */
  function borrar(id: string): Gasto | undefined {
    const g = porId(id)
    _gastos.value = _gastos.value.filter(x => x.id !== id)
    bg($fetch(`/api/gastos/${id}`, { method: 'DELETE' }))
    return g
  }
  /** Deshacer un borrado: vuelve a crear el mismo recibo (mismo id y folio). */
  function restaurar(g: Gasto) {
    _gastos.value = [g, ..._gastos.value]
    bg($fetch('/api/gastos', { method: 'POST', body: serialize(g) }))
  }

  function añadirCategoria(c: { label: string; icon: string; color: string }): Categoria | null {
    const label = c.label.trim()
    const id = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
    if (!id || _categorias.value.some(x => x.id === id)) return null
    const cat: Categoria = { id, label, icon: c.icon, color: c.color, sort: _categorias.value.length }
    _categorias.value = [..._categorias.value, cat]
    bg($fetch('/api/categories', { method: 'POST', body: cat }))
    return cat
  }
  function editarCategoria(id: string, patch: Partial<Categoria>) {
    const i = _categorias.value.findIndex(c => c.id === id)
    if (i >= 0) _categorias.value[i] = { ...(_categorias.value[i] as Categoria), ...patch }
    bg($fetch(`/api/categories/${id}`, { method: 'PATCH', body: patch }))
  }
  /** Quita la categoría. Si tiene gastos, se mueven a `moveTo`. */
  function quitarCategoria(id: string, moveTo?: string): boolean {
    const usada = _gastos.value.some(g => g.category === id)
    if (usada && !moveTo) return false
    if (usada && moveTo) {
      _gastos.value = _gastos.value.map(g => g.category === id ? { ...g, category: moveTo } : g)
    }
    _categorias.value = _categorias.value.filter(c => c.id !== id)
    bg($fetch(`/api/categories/${id}`, { method: 'DELETE', query: moveTo ? { moveTo } : {} }))
    return true
  }

  // ── Gastos fijos ──
  // Cada fijo deja su recibo en cada quincena (con el precio de ese momento).
  // Crear, cambiar o quitar un fijo toca solo el recibo de la quincena en curso:
  // las anteriores quedan como estaban.
  function reciboFijo(id: string, p: Periodo = periodoDe(hoy())) {
    return inPeriodo(_gastos.value, p).find(g => g.fijo === id)
  }
  function crearFijo(f: Omit<Fijo, 'id' | 'sort'>): Fijo {
    const nuevo: Fijo = { ...f, label: f.label.trim(), id: nuevoId(), sort: _fijos.value.length + 1 }
    const recibo: Gasto = {
      id: nuevoId(), folio: siguienteFolio(), amount: nuevo.amount, currency: nuevo.currency, category: nuevo.category,
      note: nuevo.label, date: inicioPeriodo(periodoDe(hoy())), createdAt: new Date(), fijo: nuevo.id,
    }
    _fijos.value = [..._fijos.value, nuevo]
    _gastos.value = [recibo, ..._gastos.value]
    bg(
      $fetch<{ gasto: any }>('/api/fixed', { method: 'POST', body: { ...nuevo, gastoId: recibo.id, hoy: isoD(hoy()) } }).then((r) => {
        const i = _gastos.value.findIndex(x => x.id === recibo.id)
        if (i >= 0 && r?.gasto) _gastos.value[i] = hydrate(r.gasto)
      }),
    )
    return nuevo
  }
  function editarFijo(id: string, patch: Partial<Pick<Fijo, 'label' | 'amount' | 'category'>>) {
    const i = _fijos.value.findIndex(f => f.id === id)
    if (i >= 0) _fijos.value[i] = { ...(_fijos.value[i] as Fijo), ...patch }
    const r = reciboFijo(id)
    if (r) {
      const j = _gastos.value.findIndex(g => g.id === r.id)
      _gastos.value[j] = {
        ...r,
        ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...(patch.label !== undefined ? { note: patch.label } : {}),
      }
    }
    bg($fetch(`/api/fixed/${id}`, { method: 'PATCH', body: { ...patch, hoy: isoD(hoy()) } }))
  }
  function quitarFijo(id: string) {
    const r = reciboFijo(id)
    _fijos.value = _fijos.value.filter(f => f.id !== id)
    if (r) _gastos.value = _gastos.value.filter(g => g.id !== r.id)
    bg($fetch(`/api/fixed/${id}`, { method: 'DELETE', query: { hoy: isoD(hoy()) } }))
  }

  return {
    gastos: _gastos,
    categorias: _categorias,
    fijos: _fijos,
    usuario: _user,
    moneda: _moneda,
    budget: _budget,
    remindDaily: _remindDaily,
    remindHour: _remindHour,
    hasPassword: _hasPassword,
    porId, siguienteFolio, crear, actualizar, borrar, restaurar,
    añadirCategoria, editarCategoria, quitarCategoria,
    reciboFijo, crearFijo, editarFijo, quitarFijo,
  }
}
