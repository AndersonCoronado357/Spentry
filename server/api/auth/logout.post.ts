import { SESSION_COOKIE } from '../../utils/auth'
import { markOffline } from '../../utils/acmsyMirror'

export default defineEventHandler(async (event) => {
  const user = event.context.user as { email?: string } | null
  if (user?.email) await markOffline(user.email)
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
  return { ok: true }
})
