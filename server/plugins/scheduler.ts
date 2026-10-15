import { sendDailyReminders, pushEnabled } from '../utils/push'

// Programador interno: cada 10 min revisa qué usuarios ya llegaron a su hora
// de recordatorio (hora Colombia) y aún no lo recibieron hoy.
export default defineNitroPlugin(() => {
  if (!pushEnabled()) return
  const tick = async () => {
    try {
      const co = new Date(Date.now() - 5 * 3600 * 1000) // hora Colombia (UTC-5)
      await sendDailyReminders(co.toISOString().slice(0, 10), co.getUTCHours())
    } catch {
      /* no interrumpir el servidor */
    }
  }
  setInterval(tick, 10 * 60 * 1000)
  void tick()
})
