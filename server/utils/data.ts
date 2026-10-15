// Repo de datos de Spentry (Nitro): gastos, categorías y perfil.
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
  }
}

const cleanNote = (v: unknown) => {
  const s = String(v ?? '').trim().slice(0, 200)
  return s || null
}
const cleanAmount = (v: unknown) => Math.max(0, Math.round(Number(v) || 0))

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
    `INSERT INTO expenses (id, user_id, folio, amount, currency, category, note, spent_on)
     VALUES (?,?,?,?,?,?,?,?)`,
    [id, userId, folio, amount, String(b.currency || 'COP').slice(0, 8), String(b.category || 'otros').slice(0, 60), cleanNote(b.note), date]
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

export async function getAllData(userId: number, user: any) {
  const [gastos, categorias] = await Promise.all([getGastos(userId), getCategories(userId)])
  return {
    gastos,
    categorias,
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
