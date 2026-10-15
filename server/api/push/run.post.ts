import { sendDailyReminders } from '../../utils/push'

// Dispara los recordatorios diarios. Protegido con CRON_SECRET. Lo usa el
// programador interno y sirve para pruebas manuales (?hour=23 fuerza la hora).
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET
  const q = getQuery(event)
  const given = getHeader(event, 'x-cron-secret') || (typeof q.secret === 'string' ? q.secret : '')
  if (!secret || given !== secret) throw createError({ statusCode: 401, statusMessage: 'No autorizado' })
  const co = new Date(Date.now() - 5 * 3600 * 1000)
  const today = (typeof q.today === 'string' && q.today) || co.toISOString().slice(0, 10)
  const hour = typeof q.hour === 'string' ? Number(q.hour) : co.getUTCHours()
  return sendDailyReminders(today, hour)
})
