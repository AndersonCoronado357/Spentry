import { updateCategory } from '../../utils/data'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const b = await readBody(event)
  await updateCategory(user.id, getRouterParam(event, 'id')!, b || {})
  return { ok: true }
})
