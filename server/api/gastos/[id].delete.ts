import { deleteGasto } from '../../utils/data'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  await deleteGasto(user.id, getRouterParam(event, 'id')!)
  return { ok: true }
})
