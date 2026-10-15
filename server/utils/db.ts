// Pool MySQL compartido (solo servidor / Nitro). Lee credenciales del entorno.
// Local: .env con DB_*. acmsy: mismas variables (o DATABASE_URL) inyectadas.
import mysql from 'mysql2/promise'

let _pool: mysql.Pool | null = null

export function db(): mysql.Pool {
  if (_pool) return _pool
  const url = process.env.DATABASE_URL
  if (url) {
    _pool = mysql.createPool({ uri: url, dateStrings: true, connectionLimit: 10 })
  } else {
    _pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'spentry',
      dateStrings: true, // DATE/DATETIME -> 'YYYY-MM-DD'
      charset: 'utf8mb4',
      connectionLimit: 10,
      waitForConnections: true,
    })
  }
  return _pool
}
