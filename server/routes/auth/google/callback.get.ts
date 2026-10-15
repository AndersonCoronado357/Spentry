import { googleConfig, exchangeGoogleCode, GOOGLE_STATE_COOKIE } from '../../../utils/google'
import { findOrCreateOAuthUser } from '../../../utils/users'
import { createSession, SESSION_COOKIE } from '../../../utils/auth'
import { recordLogin } from '../../../utils/acmsyMirror'

// Callback de Google: valida el state, canjea el code, crea/reutiliza el usuario
// por correo y abre sesión.
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const cfg = googleConfig(url.origin)
  const q = getQuery(event)
  const code = typeof q.code === 'string' ? q.code : undefined
  const state = typeof q.state === 'string' ? q.state : undefined
  const saved = getCookie(event, GOOGLE_STATE_COOKIE)
  deleteCookie(event, GOOGLE_STATE_COOKIE, { path: '/' })

  if (q.error) return sendRedirect(event, '/login?error=google', 303)
  if (!cfg.configured || !code || !state || !saved || state !== saved) {
    return sendRedirect(event, '/login?error=google', 303)
  }

  const profile = await exchangeGoogleCode(cfg, code)
  if (!profile) return sendRedirect(event, '/login?error=google', 303)

  const user = await findOrCreateOAuthUser({
    name: profile.name,
    email: profile.email,
    googleId: profile.sub || undefined,
  })
  await recordLogin(user.email, 'google', { name: user.name, googleId: profile.sub || 'google' })

  setCookie(event, SESSION_COOKIE, createSession(user.id), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: 60 * 60 * 24 * 30,
  })
  return sendRedirect(event, '/', 303)
})
