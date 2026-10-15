// Autenticación (solo servidor / Nitro): hash de contraseñas (scrypt) y sesión firmada.
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto'

export const SESSION_COOKIE = 'spentry_session'

export function hashPassword(pw: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pw, salt, 64)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(pw: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  try {
    const salt = Buffer.from(parts[1]!, 'hex')
    const hash = Buffer.from(parts[2]!, 'hex')
    const test = scryptSync(pw, salt, hash.length)
    return hash.length === test.length && timingSafeEqual(hash, test)
  } catch {
    return false
  }
}

function secret(): string {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me'
}

export function createSession(userId: number, days = 30): string {
  const exp = Date.now() + days * 86400000
  const payload = `${userId}.${exp}`
  const sig = createHmac('sha256', secret()).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifySession(token?: string | null): number | null {
  if (!token) return null
  const lastDot = token.lastIndexOf('.')
  if (lastDot <= 0) return null
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  const expect = createHmac('sha256', secret()).update(payload).digest('hex')
  if (
    sig.length !== expect.length ||
    !timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expect, 'hex'))
  ) {
    return null
  }
  const [uidStr, expStr] = payload.split('.')
  const exp = Number(expStr)
  if (!exp || Date.now() > exp) return null
  const uid = Number(uidStr)
  return Number.isInteger(uid) ? uid : null
}
