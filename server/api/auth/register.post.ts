import { hashPassword, createSession, SESSION_COOKIE } from '../../utils/auth'
import { createUser, emailTaken } from '../../utils/users'
import { recordLogin } from '../../utils/acmsyMirror'

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const b = await readBody(event).catch(() => null)
  const name = String(b?.name ?? '').trim()
  const email = String(b?.email ?? '').trim()
  const password = String(b?.password ?? '')

  if (name.length < 2) throw createError({ statusCode: 400, statusMessage: 'Escribe tu nombre' })
  if (!RE_EMAIL.test(email)) throw createError({ statusCode: 400, statusMessage: 'Correo inválido' })
  if (password.length < 8)
    throw createError({ statusCode: 400, statusMessage: 'La contraseña tiene mínimo 8 caracteres' })
  if (await emailTaken(email))
    throw createError({ statusCode: 409, statusMessage: 'Ese correo ya está registrado' })

  const passwordHash = hashPassword(password)
  const user = await createUser({ name, email, passwordHash })
  await recordLogin(email, 'email', { name, passwordHash })

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
