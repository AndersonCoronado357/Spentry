// En cada request: si hay cookie de sesión válida, carga el usuario en el contexto.
import { SESSION_COOKIE, verifySession } from '../utils/auth'
import { getUserById } from '../utils/users'
import { touchSeen } from '../utils/acmsyMirror'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, SESSION_COOKIE)
  const uid = verifySession(token)
  const user = uid ? await getUserById(uid) : null
  event.context.user = user
  // Marca "en línea" para el panel de acmsy (best-effort, no bloquea).
  if (user?.email) void touchSeen(user.email)
})
