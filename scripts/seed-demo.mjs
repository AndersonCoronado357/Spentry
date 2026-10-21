// Cuenta de demostración con ~3 meses de gastos, para probar Spentry en local.
// Uso: npm run db:demo   (requiere haber corrido antes npm run db:init)
//
// Credenciales de prueba (solo para la base local):
//   correo:     demo@spentry.test
//   contraseña: la de DEMO_PASSWORD en el .env (no se guarda en el repo)
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, scryptSync } from 'node:crypto'
import mysql from 'mysql2/promise'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const EMAIL = 'demo@spentry.test'
const PASSWORD = process.env.DEMO_PASSWORD || ''

const db = process.env.DATABASE_URL
  ? await mysql.createConnection({ uri: process.env.DATABASE_URL, dateStrings: true })
  : await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'spentry',
      dateStrings: true,
    })

function hash(pw) {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('hex')}$${scryptSync(pw, salt, 64).toString('hex')}`
}

const CATS = [
  ['comida', 'Comida', 'food', '#76B83F'],
  ['transporte', 'Transporte', 'bus', '#7D62CC'],
  ['mercado', 'Mercado', 'basket', '#E5A136'],
  ['servicios', 'Servicios', 'bolt', '#3B78C9'],
  ['salud', 'Salud', 'heart', '#E4839A'],
  ['hogar', 'Hogar', 'house', '#147A69'],
  ['compras', 'Compras', 'bag', '#CDA43C'],
  ['ocio', 'Ocio', 'ticket', '#B0509E'],
  ['cafe', 'Café', 'coffee', '#C8643F'],
  ['gasolina', 'Gasolina', 'fuel', '#2E95C0'],
  ['mascotas', 'Mascotas', 'paw', '#8C9A2C'],
  ['gimnasio', 'Gimnasio', 'dumbbell', '#6E7FD6'],
  ['regalos', 'Regalos', 'gift', '#D45D8C'],
  ['educacion', 'Educación', 'school', '#4F9D8F'],
  ['ropa', 'Ropa', 'shirt', '#9A6BC9'],
  ['viajes', 'Viajes', 'plane', '#3E86B5'],
]

// [categoría, notas posibles, rango de monto, probabilidad diaria]
const PATRONES = [
  ['comida', ['Almuerzo', 'Corrientazo', 'Domicilio', 'Hamburguesa', 'Empanadas', 'Arepa con queso', ''], [12000, 38000], 0.8],
  ['cafe', ['Tinto', 'Capuchino', 'Café y pandebono', 'Latte', ''], [3500, 12000], 0.55],
  ['transporte', ['Bus', 'Uber', 'Metro', 'Taxi', 'Bicicleta', ''], [2950, 24000], 0.7],
  ['mercado', ['Mercado de la semana', 'D1', 'Fruver', 'Tienda de la esquina', 'Ara'], [18000, 160000], 0.24],
  ['ocio', ['Cine', 'Salida con amigos', 'Concierto', 'Videojuego', 'Bolos'], [20000, 95000], 0.13],
  ['compras', ['Audífonos', 'Libro', 'Cargador', 'Mochila'], [25000, 180000], 0.06],
  ['salud', ['Farmacia', 'Consulta', 'Vitaminas', 'Odontólogo'], [9000, 85000], 0.06],
  ['gasolina', ['Tanqueo', 'Medio tanque'], [60000, 140000], 0.1],
  ['mascotas', ['Concentrado', 'Veterinaria', 'Arena', 'Juguete'], [15000, 90000], 0.07],
  ['regalos', ['Cumpleaños', 'Detalle', 'Flores'], [20000, 120000], 0.04],
  ['ropa', ['Camiseta', 'Tenis', 'Pantalón', 'Chaqueta'], [40000, 220000], 0.04],
  ['educacion', ['Curso en línea', 'Libro técnico', 'Fotocopias'], [5000, 150000], 0.04],
  ['viajes', ['Tiquete', 'Hotel', 'Peajes'], [45000, 380000], 0.02],
]
// Gastos fijos de cada quincena (tabla fixed_expenses). Cada quincena dejan su
// recibo con el precio que tenían entonces, así el historial muestra los cambios.
// [id, categoría, nombre, monto actual, quincenas que lleva (null = todo el
//  historial), precios anteriores [[desde hace N quincenas, monto]]]
const FIJOS_Q = [
  ['fijoarriendo', 'hogar', 'Arriendo', 475000, null, [[6, 450000]]],
  ['fijoadmin', 'hogar', 'Administración', 90000, null, [[6, 85000]]],
  ['fijomercado', 'mercado', 'Mercado', 180000, null, []],
  ['fijopasajes', 'transporte', 'Pasajes', 60000, null, [[8, 55000]]],
  ['fijogasolina', 'gasolina', 'Gasolina', 120000, null, []],
  ['fijointernet', 'servicios', 'Internet', 45000, null, [[4, 42000]]],
  ['fijoluz', 'servicios', 'Luz y agua', 71000, null, [[3, 68500], [7, 66000]]],
  ['fijocelular', 'servicios', 'Plan de celular', 22500, null, []],
  ['fijogimnasio', 'gimnasio', 'Gimnasio', 49500, 8, []],
  ['fijostreaming', 'ocio', 'Streaming', 19900, null, [[5, 17900]]],
  ['fijocurso', 'educacion', 'Cuota del curso', 75000, 6, []],
  ['fijoseguro', 'salud', 'Seguro médico', 38000, null, []],
]
// Quincenas con el mismo orden que la app: año*24 + mes*2 + (0 del 1 al 15, 1 del 16 en adelante).
const quincenaDe = (d) => d.getFullYear() * 24 + d.getMonth() * 2 + (d.getDate() <= 15 ? 0 : 1)
const inicioDe = (o) => `${Math.floor(o / 24)}-${String(Math.floor((o % 24) / 2) + 1).padStart(2, '0')}-${o % 2 ? '16' : '01'}`

// SEED_EMAIL=<correo> carga los datos en una cuenta YA existente (p. ej. la
// tuya en producción) sin borrar nada: agrega las categorías que falten y suma
// los gastos con folios a continuación de los que ya tenga. No toca su
// contraseña, nombre ni ajustes.
const SEED_EMAIL = (process.env.SEED_EMAIL || '').trim().toLowerCase()
if (!SEED_EMAIL && !PASSWORD) {
  console.error('Falta DEMO_PASSWORD en el .env: es la contraseña de la cuenta demo.')
  process.exit(1)
}
let userId
let folioBase = 0
if (SEED_EMAIL) {
  const [u] = await db.query('SELECT id FROM users WHERE email = ?', [SEED_EMAIL])
  if (!u[0]) { console.error(`No existe una cuenta con el correo ${SEED_EMAIL}.`); process.exit(1) }
  userId = u[0].id
  const [mx] = await db.query('SELECT COALESCE(MAX(folio),0) AS f, COUNT(*) AS n FROM expenses WHERE user_id = ?', [userId])
  folioBase = Number(mx[0].f)
  console.log(`Cuenta encontrada: ya tenía ${mx[0].n} gastos (se conservan).`)
  const [ms] = await db.query('SELECT COALESCE(MAX(sort),0) AS s FROM categories WHERE user_id = ?', [userId])
  let sort = Number(ms[0].s)
  for (const c of CATS) {
    await db.query('INSERT IGNORE INTO categories (user_id, id, label, icon, color, sort) VALUES (?,?,?,?,?,?)', [userId, c[0], c[1], c[2], c[3], ++sort])
  }
} else {
  const [u] = await db.query('SELECT id FROM users WHERE email = ?', [EMAIL])
  userId = u[0]?.id
  if (!userId) {
    const [r] = await db.query(
      'INSERT INTO users (name, email, password_hash, initials, budget) VALUES (?,?,?,?,?)',
      ['Ander Demo', EMAIL, hash(PASSWORD), 'AD', 4000000],
    )
    userId = r.insertId
  } else {
    await db.query('UPDATE users SET password_hash = ?, budget = ? WHERE id = ?', [hash(PASSWORD), 4000000, userId])
  }
  await db.query('DELETE FROM expenses WHERE user_id = ?', [userId])
  await db.query('DELETE FROM fixed_expenses WHERE user_id = ?', [userId])
  await db.query('DELETE FROM categories WHERE user_id = ?', [userId])
  for (const [i, c] of CATS.entries()) {
    await db.query('INSERT INTO categories (user_id, id, label, icon, color, sort) VALUES (?,?,?,?,?,?)', [userId, c[0], c[1], c[2], c[3], i])
  }
}

let seed = 42
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const pick = (a) => a[Math.floor(rnd() * a.length)]
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const hoy = new Date()
hoy.setHours(12, 0, 0, 0)
const DIAS = 185
const rows = []
for (let back = DIAS; back >= 0; back--) {
  const d = new Date(hoy)
  d.setDate(d.getDate() - back)
  const finDe = d.getDay() === 0 || d.getDay() === 6
  for (const [cat, notas, [lo, hi], p] of PATRONES) {
    const prob = finDe && (cat === 'ocio' || cat === 'comida') ? p * 1.4 : p
    if (rnd() < prob) {
      const v = Math.round((lo + rnd() * (hi - lo)) / 50) * 50
      const h = 7 + Math.floor(rnd() * 14)
      rows.push([cat, pick(notas), v, iso(d), `${iso(d)} ${String(h).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}:00`, null])
    }
  }
}
// El recibo de cada fijo en cada quincena del historial, con su precio de entonces.
const actual = quincenaDe(hoy)
if (!SEED_EMAIL) {
  const primera = quincenaDe(new Date(hoy.getTime() - DIAS * 86400000))
  for (let p = primera; p <= actual; p++) {
    const hace = actual - p
    for (const [i, [fid, cat, nota, v, lleva, antes]] of FIJOS_Q.entries()) {
      if (lleva != null && hace >= lleva) continue
      const precio = antes.filter(([n]) => hace >= n).reduce((m, [, x]) => x, v)
      rows.push([cat, nota, precio, inicioDe(p), `${inicioDe(p)} 06:${String(i).padStart(2, '0')}:00`, fid])
    }
  }
}
rows.sort((a, b) => a[4].localeCompare(b[4]))
let folio = folioBase
if (!SEED_EMAIL) {
  for (const [i, [fid, cat, nota, v]] of FIJOS_Q.entries()) {
    // gen: ya dejaron su recibo hasta la quincena en curso (la app sigue desde la próxima).
    await db.query('INSERT INTO fixed_expenses (id, user_id, label, amount, currency, category, sort, gen) VALUES (?,?,?,?,?,?,?,?)', [fid, userId, nota, v, 'COP', cat, i + 1, actual])
  }
}
for (const [cat, note, amount, date, created, fid] of rows) {
  folio++
  await db.query(
    'INSERT INTO expenses (id, user_id, folio, amount, currency, category, note, spent_on, created_at, fixed_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
    ['g' + randomBytes(9).toString('hex'), userId, folio, amount, 'COP', cat, note || null, date, created, fid],
  )
}
await db.end()
console.log(SEED_EMAIL ? `Listo: se agregaron ${rows.length} gastos a ${SEED_EMAIL}.` : `Cuenta demo lista (${EMAIL}) con ${rows.length} gastos.`)
