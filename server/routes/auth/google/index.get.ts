import { randomBytes } from 'node:crypto'
import { googleConfig, googleAuthUrl, GOOGLE_STATE_COOKIE } from '../../../utils/google'

// Inicia el flujo OAuth de Google. Sin credenciales, vuelve al login con aviso.
export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin
  const cfg = googleConfig(origin)
  if (!cfg.configured) return sendRedirect(event, '/login?error=google-nc', 303)

  const state = randomBytes(16).toString('hex')
  setCookie(event, GOOGLE_STATE_COOKIE, state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: 600,
  })
  return sendRedirect(event, googleAuthUrl(cfg, state), 303)
})
