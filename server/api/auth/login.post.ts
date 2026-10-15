import { verifyPassword, createSession, SESSION_COOKIE } from '../../utils/auth'
import { findUserForLogin } from '../../utils/users'
import { recordLogin } from '../../utils/acmsyMirror'

export default defineEventHandler(async (event) => {
  const b = await readBody(event).catch(() => null)
  const login = String(b?.login ?? b?.email ?? '').trim()
  const password = String(b?.password ?? '')
  if (!login || !password) throw createError({ statusCode: 400, statusMessage: 'Faltan datos' })

  const user = await findUserForLogin(login)
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw createError({ statusCode: 401, statusMessage: 'Correo o contraseña incorrectos' })
  }

  await recordLogin(user.email, 'email', { name: user.name, passwordHash: user.password_hash })

  setCookie(event, SESSION_COOKIE, createSession(user.id), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: 60 * 60 * 24 * 30,
  })
  const { password_hash, ...safe } = user
  return { ok: true, user: safe }
})
