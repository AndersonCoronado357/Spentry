import { hashPassword, verifyPassword } from '../../utils/auth'
import { setPassword } from '../../utils/users'
import { requireUser } from '../../utils/session'

// Cambia la contraseña. Si la cuenta se creó con Google (sin contraseña),
// permite definir una sin pedir la actual.
export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const b = await readBody(event).catch(() => null)
  const actual = String(b?.current ?? '')
  const nueva = String(b?.next ?? '')
  if (nueva.length < 8)
    throw createError({ statusCode: 400, statusMessage: 'La nueva contraseña tiene mínimo 8 caracteres' })
  if (user.password_hash && !verifyPassword(actual, user.password_hash))
    throw createError({ statusCode: 401, statusMessage: 'La contraseña actual no es correcta' })
  await setPassword(user.id, hashPassword(nueva))
  return { ok: true }
})
