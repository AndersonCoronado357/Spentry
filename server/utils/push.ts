// Web Push (solo servidor / Nitro). Configura VAPID, guarda/borra suscripciones
// y envía. Incluye el recordatorio diario para anotar los gastos.
import webpush from 'web-push'
import type { RowDataPacket } from 'mysql2'
import { createHash, randomUUID } from 'node:crypto'
import { db } from './db'

let configured = false
function ensureConfigured(): boolean {
  if (configured) return true
  const pub = process.env.VAPID_PUBLIC
  const priv = process.env.VAPID_PRIVATE
  if (!pub || !priv) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:noreply@acmsy.com', pub, priv)
  configured = true
  return true
}

export function pushEnabled(): boolean {
  return !!(process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE)
}
export function vapidPublicKey(): string {
  return process.env.VAPID_PUBLIC || ''
}

const hashEndpoint = (e: string) => createHash('sha256').update(e).digest('hex')

export type SubInput = { endpoint: string; keys: { p256dh: string; auth: string } }

export async function saveSubscription(userId: number, sub: SubInput): Promise<void> {
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return
  await db().query(
    `INSERT INTO push_subscriptions (id, user_id, endpoint_hash, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), endpoint = VALUES(endpoint),
       p256dh = VALUES(p256dh), auth = VALUES(auth)`,
    [randomUUID(), userId, hashEndpoint(sub.endpoint), sub.endpoint, sub.keys.p256dh, sub.keys.auth]
  )
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await db().query('DELETE FROM push_subscriptions WHERE endpoint_hash = ?', [hashEndpoint(endpoint)])
}

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string }

async function subsForUser(userId: number): Promise<SubRow[]> {
  const [rows] = await db().query<RowDataPacket[]>(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
    [userId]
  )
  return rows as SubRow[]
}

async function sendTo(sub: SubRow, payload: string): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
      { urgency: 'normal', TTL: 3600 }
    )
    return true
  } catch (e) {
    const code = (e as { statusCode?: number })?.statusCode
    if (code === 404 || code === 410) {
      await db().query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id])
    }
    return false
  }
}

export async function sendToUser(userId: number, title: string, body: string, url = '/'): Promise<number> {
  if (!ensureConfigured()) return 0
  const subs = await subsForUser(userId)
  const payload = JSON.stringify({ title, body, url })
  let ok = 0
  for (const s of subs) if (await sendTo(s, payload)) ok++
  return ok
}

// Recordatorio diario: a la hora elegida por cada usuario (hora Colombia),
// una sola vez por día. Si ya anotó algo hoy, el mensaje cambia de tono.
// `today` en 'YYYY-MM-DD' y `hour` 0–23, ambos en hora Colombia.
export async function sendDailyReminders(today: string, hour: number): Promise<{ sent: number; users: number }> {
  if (!ensureConfigured()) return { sent: 0, users: 0 }
  const [rows] = await db().query<RowDataPacket[]>(
    `SELECT u.id, u.name,
            (SELECT COUNT(*) FROM expenses e WHERE e.user_id = u.id AND e.spent_on = ?) AS hoy
       FROM users u
      WHERE u.remind_daily = 1
        AND u.remind_hour <= ?
        AND (u.reminded_on IS NULL OR u.reminded_on < ?)
        AND EXISTS (SELECT 1 FROM push_subscriptions p WHERE p.user_id = u.id)`,
    [today, hour, today]
  )
  const users = rows as { id: number; name: string; hoy: number }[]
  let sent = 0
  for (const u of users) {
    const nombre = String(u.name || '').split(' ')[0]
    const body = Number(u.hoy) > 0
      ? `Hoy llevas ${u.hoy} ${Number(u.hoy) === 1 ? 'recibo' : 'recibos'}. ¿Se te pasó alguno?`
      : `${nombre ? nombre + ', h' : 'H'}oy no has anotado gastos. ¿Gastaste en algo?`
    sent += await sendToUser(u.id, 'Spentry · Cierre del día', body, '/?registrar=1')
    await db().query('UPDATE users SET reminded_on = ? WHERE id = ?', [today, u.id])
  }
  return { sent, users: users.length }
}
