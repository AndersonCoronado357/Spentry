import { deleteFijo } from '../../utils/data'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  await deleteFijo(user.id, getRouterParam(event, 'id')!, getQuery(event).hoy)
  return { ok: true }
})
