import { addCategory } from '../../utils/data'
import { requireUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const b = await readBody(event)
  const cat = await addCategory(user.id, b || {})
  if (!cat) throw createError({ statusCode: 400, statusMessage: 'Escribe un nombre para la categoría' })
  return { ok: true, categoria: cat }
})
