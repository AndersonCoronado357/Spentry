import { saveSubscription } from '../../utils/push'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const sub = await readBody(event)
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    throw createError({ statusCode: 400, statusMessage: 'Suscripción inválida' })
  }
  await saveSubscription(user.id, sub)
  return { ok: true }
})
