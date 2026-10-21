import { getAllData } from '../utils/data'
import { requireUser } from '../utils/session'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  // `hoy` es el día local del cliente: define la quincena en curso (los fijos dejan su recibo hasta esa).
  return getAllData(user.id, user, getQuery(event).hoy)
})
