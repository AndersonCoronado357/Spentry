// Espejo de usuarios/logins hacia auth_users/auth_logins que lee el panel de acmsy.
// Best-effort: si algo falla, NO debe romper el login.
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { db } from './db'

const norm = (e: string) => String(e || '').trim().toLowerCase()

async function ensureAuthUser(
  email: string,
  name?: string | null,
  googleId?: string | null,
  passwordHash?: string | null
): Promise<number | null> {
  const e = norm(email)
  if (!e) return null
  await db().query(
    `INSERT INTO auth_users (email, name, google_id, password_hash, email_verified)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       name = COALESCE(VALUES(name), name),
       google_id = COALESCE(VALUES(google_id), google_id),
       password_hash = COALESCE(VALUES(password_hash), password_hash)`,
    [e, name ?? null, googleId ?? null, passwordHash ?? null]
  )
  const [rows] = await db().query<RowDataPacket[]>(
    'SELECT id FROM auth_users WHERE email = ? LIMIT 1',
    [e]
  )
  return (rows[0]?.id as number) ?? null
}

type LoginOpts = { name?: string | null; googleId?: string | null; passwordHash?: string | null }

export async function recordLogin(email: string, method: string, opts: LoginOpts = {}): Promise<void> {
  try {
    const id = await ensureAuthUser(email, opts.name, opts.googleId, opts.passwordHash)
    if (id == null) return
    await db().query(
      'UPDATE auth_users SET last_login_at = NOW(), last_seen_at = NOW(), login_count = COALESCE(login_count,0) + 1 WHERE id = ?',
      [id]
    )
    await db().query('INSERT INTO auth_logins (user_id, method, created_at) VALUES (?, ?, NOW())', [
      id,
      method,
    ])
  } catch {
    /* el espejo nunca debe romper el login */
  }
}

export async function markOffline(email: string): Promise<void> {
  try {
    await db().query('UPDATE auth_users SET last_seen_at = NULL WHERE email = ?', [norm(email)])
  } catch {
    /* noop */
  }
}

export async function touchSeen(email: string): Promise<void> {
  try {
    await db().query(
      'UPDATE auth_users SET last_seen_at = NOW() WHERE email = ? AND (last_seen_at IS NULL OR last_seen_at < (NOW() - INTERVAL 60 SECOND))',
      [norm(email)]
    )
  } catch {
    /* noop */
  }
}
