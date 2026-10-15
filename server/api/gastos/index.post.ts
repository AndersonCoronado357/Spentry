import { createGasto } from '../../utils/data'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const b = await readBody(event)
  return { gasto: await createGasto(user.id, b || {}) }
})
