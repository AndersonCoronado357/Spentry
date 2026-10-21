// Repo de datos de Spentry (Nitro): gastos, categorías, gastos fijos y perfil.
// Las fechas viajan como 'YYYY-MM-DD' (el cliente las hidrata a Date).
// Importes en enteros de la moneda original.
import type { RowDataPacket } from 'mysql2'
import { randomBytes } from 'node:crypto'
import { db } from './db'

const eid = () => 'g' + randomBytes(9).toString('hex')
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/
const RE_COLOR = /^#[0-9a-f]{6}$/i

export interface ApiGasto {
  id: string
  folio: number
  amount: number
  currency: string
  category: string
  note: string | null
  date: string
  createdAt: string
  fixedId: string | null
}

export interface ApiCategoria {
  id: string
  label: string
  icon: string
  color: string
  sort: number
}

function mapGasto(r: any): ApiGasto {
  return {
    id: r.id,
    folio: Number(r.folio),
    amount: Number(r.amount),
    currency: r.currency,
    category: r.category,
    note: r.note,
    date: r.spent_on,
    createdAt: r.created_at,
    fixedId: r.fixed_id ?? null,
  }
}

const cleanNote = (v: unknown) => {
  const s = String(v ?? '').trim().slice(0, 200)
  return s || null
}
const cleanAmount = (v: unknown) => Math.max(0, Math.round(Number(v) || 0))
const cleanId = (v: unknown) => (typeof v === 'string' && /^[a-z0-9]{1,32}$/i.test(v) ? v : null)

// ── Gastos ─────────────────────────────────────────────────────
export async function getGastos(userId: number): Promise<ApiGasto[]> {
  const [rows] = await db().query<RowDataPacket[]>(
    'SELECT * FROM expenses WHERE user_id = ? ORDER BY spent_on DESC, created_at DESC',
    [userId]
  )
  return (rows as any[]).map(mapGasto)
}

async function getGasto(userId: number, id: string): Promise<ApiGasto | null> {
  const [rows] = await db().query<RowDataPacket[]>(
    'SELECT * FROM expenses WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId]
  )
  return rows[0] ? mapGasto(rows[0]) : null
}

export async function createGasto(userId: number, b: any): Promise<ApiGasto> {
  // Usa el id del cliente (la vista optimista ya lo muestra); si no es válido, genera uno.
  const id = typeof b.id === 'string' && /^[a-z0-9]{1,32}$/i.test(b.id) ? b.id : eid()
  const amount = cleanAmount(b.amount)
  if (!amount) throw createError({ statusCode: 400, statusMessage: 'El monto debe ser mayor a cero' })
  const date = typeof b.date === 'string' && RE_DATE.test(b.date) ? b.date : new Date().toISOString().slice(0, 10)
  // Folio consecutivo por usuario (número del "recibo"). Al deshacer un
  // borrado el cliente reenvía su folio original y se respeta si está libre.
  let folio = 0
  const pedido = Number(b.folio)
  if (Number.isInteger(pedido) && pedido > 0) {
    const [taken] = await db().query<RowDataPacket[]>('SELECT id FROM expenses WHERE user_id = ? AND folio = ? LIMIT 1', [userId, pedido])
    if (!taken.length) folio = pedido
  }
  if (!folio) {
    const [mx] = await db().query<RowDataPacket[]>('SELECT COALESCE(MAX(folio),0) AS f FROM expenses WHERE user_id = ?', [userId])
    folio = Number(mx[0]?.f ?? 0) + 1
  }
  await db().query(
    `INSERT INTO expenses (id, user_id, folio, amount, currency, category, note, spent_on, fixed_id)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, userId, folio, amount, String(b.currency || 'COP').slice(0, 8), String(b.category || 'otros').slice(0, 60), cleanNote(b.note), date, cleanId(b.fixedId)]
  )
  return (await getGasto(userId, id))!
}

export async function updateGasto(userId: number, id: string, p: any): Promise<ApiGasto | null> {
  const sets: string[] = []
  const vals: any[] = []
  if (p.amount !== undefined) { sets.push('amount = ?'); vals.push(cleanAmount(p.amount)) }
  if (p.currency !== undefined) { sets.push('currency = ?'); vals.push(String(p.currency).slice(0, 8)) }
  if (p.category !== undefined) { sets.push('category = ?'); vals.push(String(p.category).slice(0, 60)) }
  if (p.note !== undefined) { sets.push('note = ?'); vals.push(cleanNote(p.note)) }
  if (typeof p.date === 'string' && RE_DATE.test(p.date)) { sets.push('spent_on = ?'); vals.push(p.date) }
  if (sets.length) {
    vals.push(id, userId)
    await db().query(`UPDATE expenses SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, vals)
  }
  return getGasto(userId, id)
}

export async function deleteGasto(userId: number, id: string): Promise<void> {
  await db().query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId])
}

// ── Categorías ─────────────────────────────────────────────────
export const DEFAULT_CATEGORIES: Omit<ApiCategoria, 'sort'>[] = [
  // Colores en el orden validado (separación también para daltonismo).
  { id: 'comida',      label: 'Comida',      icon: 'food',    color: '#76B83F' },
  { id: 'transporte',  label: 'Transporte',  icon: 'bus',     color: '#7D62CC' },
  { id: 'mercado',     label: 'Mercado',     icon: 'basket',  color: '#E5A136' },
  { id: 'servicios',   label: 'Servicios',   icon: 'bolt',    color: '#3B78C9' },
  { id: 'salud',       label: 'Salud',       icon: 'heart',   color: '#E4839A' },
  { id: 'hogar',       label: 'Hogar',       icon: 'house',   color: '#147A69' },
  { id: 'compras',     label: 'Compras',     icon: 'bag',     color: '#CDA43C' },
  { id: 'ocio',        label: 'Ocio',        icon: 'ticket',  color: '#B0509E' },
]

export async function seedDefaultCategories(userId: number): Promise<void> {
  let i = 0
  for (const c of DEFAULT_CATEGORIES) {
    await db().query(
      'INSERT IGNORE INTO categories (user_id, id, label, icon, color, sort) VALUES (?,?,?,?,?,?)',
      [userId, c.id, c.label, c.icon, c.color, i++]
    )
  }
}

export function slugify(label: string): string {
  return String(label || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export async function getCategories(userId: number): Promise<ApiCategoria[]> {
  const [rows] = await db().query<RowDataPacket[]>(
    'SELECT id, label, icon, color, sort FROM categories WHERE user_id = ? ORDER BY sort, label',
    [userId]
  )
  return rows as ApiCategoria[]
}

export async function addCategory(userId: number, b: any): Promise<ApiCategoria | null> {
  const label = String(b?.label ?? '').trim().slice(0, 80)
  const id = (typeof b?.id === 'string' && /^[a-z0-9-]{1,60}$/.test(b.id)) ? b.id : slugify(label)
  if (!id || !label) return null
  const icon = String(b?.icon || 'tag').slice(0, 30)
  const color = RE_COLOR.test(String(b?.color)) ? String(b.color) : '#96D15A'
  const [mx] = await db().query<RowDataPacket[]>('SELECT COALESCE(MAX(sort),0) AS s FROM categories WHERE user_id = ?', [userId])
  await db().query(
    'INSERT IGNORE INTO categories (user_id, id, label, icon, color, sort) VALUES (?,?,?,?,?,?)',
    [userId, id, label, icon, color, Number(mx[0]?.s ?? 0) + 1]
  )
  return { id, label, icon, color, sort: Number(mx[0]?.s ?? 0) + 1 }
}

export async function updateCategory(userId: number, id: string, p: any): Promise<void> {
  const sets: string[] = []
  const vals: any[] = []
  if (p.label !== undefined && String(p.label).trim()) { sets.push('label = ?'); vals.push(String(p.label).trim().slice(0, 80)) }
  if (p.icon !== undefined) { sets.push('icon = ?'); vals.push(String(p.icon).slice(0, 30)) }
  if (p.color !== undefined && RE_COLOR.test(String(p.color))) { sets.push('color = ?'); vals.push(String(p.color)) }
  if (!sets.length) return
  vals.push(userId, id)
  await db().query(`UPDATE categories SET ${sets.join(', ')} WHERE user_id = ? AND id = ?`, vals)
}

// Quitar una categoría: si tiene gastos, se mueven a `moveTo` (si se indica);
// si no se indica destino y está en uso, no se borra.
export async function removeCategory(userId: number, id: string, moveTo?: string): Promise<boolean> {
  const [used] = await db().query<RowDataPacket[]>('SELECT id FROM expenses WHERE user_id = ? AND category = ? LIMIT 1', [userId, id])
  if (used.length) {
    if (!moveTo || moveTo === id) return false
    await db().query('UPDATE expenses SET category = ? WHERE user_id = ? AND category = ?', [moveTo, userId, id])
  }
  await db().query('DELETE FROM categories WHERE user_id = ? AND id = ?', [userId, id])
  return true
}

// ── Gastos fijos ───────────────────────────────────────────────
// Lo que se gasta fijo en cada quincena (arriendo, servicios…). Cada fijo deja
// su propio recibo en cada quincena, con el precio que tenía en ese momento:
// cambiarlo o quitarlo afecta de la quincena en curso en adelante y nunca toca
// las anteriores. `gen` es la última quincena para la que ya dejó recibo.
export interface ApiFijo {
  id: string
  label: string
  amount: number
  currency: string
  category: string
  sort: number
}

// Quincenas con el mismo orden que el cliente: año*24 + mes*2 + (0 del 1 al 15, 1 del 16 en adelante).
const ordenDe = (y: number, m: number, d: number) => y * 24 + m * 2 + (d <= 15 ? 0 : 1)
const inicioDe = (o: number) => {
  const y = Math.floor(o / 24), m = Math.floor((o % 24) / 2)
  return `${y}-${String(m + 1).padStart(2, '0')}-${o % 2 ? '16' : '01'}`
}
/** Quincena en curso según el día local del cliente ('YYYY-MM-DD'). Si no llega
 *  o se aleja más de dos días del reloj del servidor, se usa el del servidor. */
export function quincenaActual(hoy?: unknown): number {
  const ahora = new Date()
  if (typeof hoy === 'string' && RE_DATE.test(hoy)) {
    const [y, m, d] = hoy.split('-').map(Number) as [number, number, number]
    if (Math.abs(Date.UTC(y, m - 1, d) - ahora.getTime()) < 2 * 86400000) return ordenDe(y, m - 1, d)
  }
  return ordenDe(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
}
const MAX_ATRASO = 48 // si alguien vuelve tras mucho tiempo, como mucho dos años de quincenas

/** Deja el recibo de cada fijo en las quincenas que aún no lo tienen (hasta la actual). */
async function generarFijos(userId: number, actual: number): Promise<void> {
  const [pend] = await db().query<RowDataPacket[]>(
    'SELECT id FROM fixed_expenses WHERE user_id = ? AND (gen IS NULL OR gen < ?) LIMIT 1',
    [userId, actual]
  )
  if (!pend.length) return
  const cn = await db().getConnection()
  try {
    await cn.beginTransaction()
    // FOR UPDATE: si dos pestañas cargan a la vez, la segunda espera y ya no encuentra pendientes.
    const [fijos] = await cn.query<RowDataPacket[]>(
      'SELECT * FROM fixed_expenses WHERE user_id = ? AND (gen IS NULL OR gen < ?) ORDER BY sort, created_at FOR UPDATE',
      [userId, actual]
    )
    if (fijos.length) {
      const [mx] = await cn.query<RowDataPacket[]>('SELECT COALESCE(MAX(folio),0) AS f FROM expenses WHERE user_id = ?', [userId])
      let folio = Number(mx[0]?.f ?? 0)
      const pares: [number, any][] = []
      for (const f of fijos as any[]) {
        const desde = f.gen == null ? actual : Math.max(Number(f.gen) + 1, actual - MAX_ATRASO + 1)
        for (let p = desde; p <= actual; p++) pares.push([p, f])
      }
      pares.sort((a, b) => a[0] - b[0] || Number(a[1].sort) - Number(b[1].sort))
      const filas = pares.map(([p, f]) => [eid(), userId, ++folio, Number(f.amount), f.currency, f.category, f.label, inicioDe(p), f.id])
      if (filas.length) {
        await cn.query('INSERT INTO expenses (id, user_id, folio, amount, currency, category, note, spent_on, fixed_id) VALUES ?', [filas])
      }
      await cn.query('UPDATE fixed_expenses SET gen = ? WHERE user_id = ? AND (gen IS NULL OR gen < ?)', [actual, userId, actual])
    }
    await cn.commit()
  } catch (e) {
    await cn.rollback()
    throw e
  } finally {
    cn.release()
  }
}

export async function getFijos(userId: number): Promise<ApiFijo[]> {
  try {
    const [rows] = await db().query<RowDataPacket[]>(
      'SELECT id, label, amount, currency, category, sort FROM fixed_expenses WHERE user_id = ? ORDER BY sort, created_at',
      [userId]
    )
    return (rows as any[]).map(r => ({ ...r, amount: Number(r.amount), sort: Number(r.sort) }))
  } catch (e: any) {
    // Sin la tabla (BD aún sin actualizar) la app sigue funcionando, solo sin fijos.
    if (e?.code === 'ER_NO_SUCH_TABLE') return []
    throw e
  }
}

/** Crea el fijo y su recibo de la quincena en curso. */
export async function createFijo(userId: number, b: any): Promise<{ fijo: ApiFijo; gasto: ApiGasto } | null> {
  const id = cleanId(b.id) ?? eid()
  const label = String(b.label ?? '').trim().slice(0, 80)
  const amount = cleanAmount(b.amount)
  if (!label || !amount) return null
  const actual = quincenaActual(b.hoy)
  const [mx] = await db().query<RowDataPacket[]>('SELECT COALESCE(MAX(sort),0) AS s FROM fixed_expenses WHERE user_id = ?', [userId])
  const fijo: ApiFijo = {
    id, label, amount,
    currency: String(b.currency || 'COP').slice(0, 8),
    category: String(b.category || 'otros').slice(0, 60),
    sort: Number(mx[0]?.s ?? 0) + 1,
  }
  await db().query(
    'INSERT INTO fixed_expenses (id, user_id, label, amount, currency, category, sort, gen) VALUES (?,?,?,?,?,?,?,?)',
    [fijo.id, userId, fijo.label, fijo.amount, fijo.currency, fijo.category, fijo.sort, actual]
  )
  const gasto = await createGasto(userId, {
    id: b.gastoId, amount: fijo.amount, currency: fijo.currency, category: fijo.category,
    note: fijo.label, date: inicioDe(actual), fixedId: fijo.id,
  })
  return { fijo, gasto }
}

/** Cambia el fijo y su recibo de la quincena en curso; las anteriores quedan como estaban. */
export async function updateFijo(userId: number, id: string, p: any): Promise<void> {
  const sets: string[] = []
  const vals: any[] = []
  const label = p.label !== undefined ? String(p.label).trim().slice(0, 80) : ''
  const amount = p.amount !== undefined ? cleanAmount(p.amount) : 0
  const category = p.category !== undefined ? String(p.category).slice(0, 60) : ''
  if (label) { sets.push('label = ?'); vals.push(label) }
  if (amount) { sets.push('amount = ?'); vals.push(amount) }
  if (category) { sets.push('category = ?'); vals.push(category) }
  if (!sets.length) return
  await db().query(`UPDATE fixed_expenses SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, [...vals, id, userId])
  const recibo = sets.map(x => x.replace('label', 'note'))
  await db().query(
    `UPDATE expenses SET ${recibo.join(', ')} WHERE user_id = ? AND fixed_id = ? AND spent_on = ?`,
    [...vals, userId, id, inicioDe(quincenaActual(p.hoy))]
  )
}

/** Quita el fijo y su recibo de la quincena en curso; los de quincenas anteriores se conservan. */
export async function deleteFijo(userId: number, id: string, hoy?: unknown): Promise<void> {
  await db().query('DELETE FROM fixed_expenses WHERE id = ? AND user_id = ?', [id, userId])
  await db().query('DELETE FROM expenses WHERE user_id = ? AND fixed_id = ? AND spent_on = ?', [userId, id, inicioDe(quincenaActual(hoy))])
}

// ── Perfil ─────────────────────────────────────────────────────
export async function updateProfile(userId: number, patch: any): Promise<void> {
  const map: Record<string, string> = {
    name: 'name', photo: 'photo', moneda: 'moneda', budget: 'budget',
    remindDaily: 'remind_daily', remindHour: 'remind_hour',
  }
  const sets: string[] = []
  const vals: any[] = []
  for (const [k, col] of Object.entries(map)) {
    if (patch[k] === undefined) continue
    let v = patch[k]
    if (k === 'remindDaily') v = v ? 1 : 0
    if (k === 'budget') v = cleanAmount(v)
    if (k === 'remindHour') v = Math.min(23, Math.max(0, Math.round(Number(v) || 20)))
    if (k === 'name') { v = String(v).trim().slice(0, 120); if (!v) continue }
    sets.push(`${col} = ?`)
    vals.push(v)
  }
  if (!sets.length) return
  vals.push(userId)
  await db().query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals)
}

export async function getAllData(userId: number, user: any, hoy?: unknown) {
  // Antes de leer, cada fijo deja su recibo en las quincenas que aún no lo tienen.
  try {
    await generarFijos(userId, quincenaActual(hoy))
  } catch (e: any) {
    if (e?.code !== 'ER_NO_SUCH_TABLE' && e?.code !== 'ER_BAD_FIELD_ERROR') console.error('[fijos] no se pudieron generar los recibos:', e?.message)
  }
  const [gastos, categorias, fijos] = await Promise.all([getGastos(userId), getCategories(userId), getFijos(userId)])
  return {
    gastos,
    categorias,
    fijos,
    perfil: {
      name: user.name,
      email: user.email,
      photo: user.photo,
      moneda: user.moneda,
      budget: Number(user.budget || 0),
      remindDaily: !!user.remind_daily,
      remindHour: Number(user.remind_hour ?? 20),
      hasPassword: !!user.password_hash,
    },
  }
}
