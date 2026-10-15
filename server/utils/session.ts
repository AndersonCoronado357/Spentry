import type { H3Event } from 'h3'

// Exige sesión: devuelve el usuario del contexto o lanza 401.
export function requireUser(event: H3Event): any {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  return user
}
