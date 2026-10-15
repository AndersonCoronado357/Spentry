import { updateGasto } from '../../utils/data'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const patch = await readBody(event)
  return { gasto: await updateGasto(user.id, getRouterParam(event, 'id')!, patch || {}) }
})
