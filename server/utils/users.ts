// Repo de usuarios (Nitro). Cada usuario se identifica por su correo.
import type { RowDataPacket, ResultSetHeader } from 'mysql2'
import { db } from './db'
import { seedDefaultCategories } from './data'

export interface DbUser {
  id: number
  name: string
  email: string
  password_hash: string | null
  google_id: string | null
  photo: string | null
  initials: string
  moneda: string
  budget: number
  remind_daily: number
  remind_hour: number
  created_at: string
}

export function initialsFrom(name: string): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0]![0]! + (parts[1]?.[0] ?? '')).toUpperCase()
}

const norm = (e: string) => String(e || '').trim().toLowerCase()

export async function getUserById(id: number): Promise<DbUser | null> {
  const [rows] = await db().query<RowDataPacket[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
  return (rows[0] as DbUser) ?? null
}

export async function findUserForLogin(login: string): Promise<DbUser | null> {
  const [rows] = await db().query<RowDataPacket[]>('SELECT * FROM users WHERE email = ? LIMIT 1', [
    norm(login),
  ])
  return (rows[0] as DbUser) ?? null
}

export async function emailTaken(email: string): Promise<boolean> {
  const [rows] = await db().query<RowDataPacket[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [
    norm(email),
  ])
  return rows.length > 0
}

export async function setPassword(userId: number, passwordHash: string): Promise<void> {
  await db().query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId])
}

// Las cuentas nuevas arrancan sin gastos pero con un set de categorías por
// defecto, para que se pueda anotar el primer gasto de inmediato.
export async function createUser(opts: {
  name: string
  email: string
  passwordHash?: string | null
  googleId?: string | null
}): Promise<DbUser> {
  const email = norm(opts.email)
  const [res] = await db().query<ResultSetHeader>(
    'INSERT INTO users (name, email, password_hash, google_id, initials) VALUES (?,?,?,?,?)',
    [opts.name, email, opts.passwordHash ?? null, opts.googleId ?? null, initialsFrom(opts.name)]
  )
  await seedDefaultCategories(res.insertId)
  return (await getUserById(res.insertId))!
}

// Para OAuth: reutiliza la cuenta del mismo correo o la crea.
export async function findOrCreateOAuthUser(opts: {
  name: string
  email: string
  googleId?: string | null
}): Promise<DbUser> {
  const existing = await findUserForLogin(opts.email)
  if (existing) {
    if (opts.googleId && !existing.google_id) {
      await db().query('UPDATE users SET google_id = ? WHERE id = ?', [opts.googleId, existing.id])
    }
    return existing
  }
  return createUser({ name: opts.name, email: opts.email, googleId: opts.googleId ?? null })
}
