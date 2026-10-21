import { createFijo } from '../../utils/data'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const b = await readBody(event)
  const r = await createFijo(user.id, b || {})
  if (!r) throw createError({ statusCode: 400, statusMessage: 'Escribe un nombre y un monto para el gasto fijo' })
  return { ok: true, ...r }
})
