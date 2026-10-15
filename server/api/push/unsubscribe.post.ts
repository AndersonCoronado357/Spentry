import { deleteSubscription } from '../../utils/push'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  requireUser(event)
  const b = await readBody(event)
  if (!b?.endpoint) throw createError({ statusCode: 400, statusMessage: 'Falta endpoint' })
  await deleteSubscription(b.endpoint)
  return { ok: true }
})
