import { removeCategory } from '../../utils/data'
import { requireUser } from '../../utils/session'

// ?moveTo=<id> mueve los gastos de la categoría a otra antes de quitarla.
export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const q = getQuery(event)
  const moveTo = typeof q.moveTo === 'string' ? q.moveTo : undefined
  const ok = await removeCategory(user.id, getRouterParam(event, 'id')!, moveTo)
  return { ok }
})
