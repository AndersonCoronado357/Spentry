// Crea la base de datos (si no existe) y aplica db/*.sql en orden.
// Uso: npm run db:init   (lee DB_* o DATABASE_URL del .env)
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Carga .env sin dependencias extra (no pisa variables ya definidas).
const envPath = join(root, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const dbName = process.env.DB_NAME || 'spentry'
const base = process.env.DATABASE_URL
  ? { uri: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    }

const conn = await mysql.createConnection({ ...base, multipleStatements: true, charset: 'utf8mb4' })
if (!process.env.DATABASE_URL) {
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await conn.query(`USE \`${dbName}\``)
}

const dir = join(root, 'db')
for (const f of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  await conn.query(readFileSync(join(dir, f), 'utf8'))
  console.log(`✓ ${f}`)
}
await conn.end()
console.log(`Base de datos "${dbName}" lista.`)
