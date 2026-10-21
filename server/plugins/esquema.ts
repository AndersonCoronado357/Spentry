import { db } from '../utils/db'

// Al arrancar, asegura lo que agregaron versiones nuevas (ver db/02-fijos.sql):
// la tabla de gastos fijos y el enlace de cada recibo con el fijo que lo generó.
async function asegurarColumna(tabla: string, columna: string, definicion: string) {
  const [r] = await db().query(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [tabla, columna]
  )
  if (!(r as unknown[]).length) await db().query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`)
}

export default defineNitroPlugin(async () => {
  try {
    await db().query(`CREATE TABLE IF NOT EXISTS fixed_expenses (
      id VARCHAR(32) NOT NULL, user_id INT UNSIGNED NOT NULL, label VARCHAR(80) NOT NULL,
      amount BIGINT NOT NULL, currency VARCHAR(8) NOT NULL DEFAULT 'COP', category VARCHAR(60) NOT NULL,
      sort INT NOT NULL DEFAULT 0, gen INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id), KEY idx_fixed_user (user_id),
      CONSTRAINT fk_fixed_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`)
    await asegurarColumna('fixed_expenses', 'gen', 'INT NULL')
    await asegurarColumna('expenses', 'fixed_id', 'VARCHAR(32) NULL')
  } catch (e) {
    console.error('[esquema] no se pudo asegurar lo de gastos fijos:', (e as Error).message)
  }
})
