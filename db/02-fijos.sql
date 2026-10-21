-- Spentry — gastos fijos por quincena. Se aplica sobre 01-schema.sql.
-- El servidor también lo asegura al arrancar (server/plugins/esquema.ts).
SET NAMES utf8mb4;

-- Gastos fijos: se repiten en cada quincena. `gen` es la última quincena
-- (año*24 + mes*2 + quincena) para la que ya dejaron su recibo.
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id          VARCHAR(32)  NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  label       VARCHAR(80)  NOT NULL,
  amount      BIGINT       NOT NULL,
  currency    VARCHAR(8)   NOT NULL DEFAULT 'COP',
  category    VARCHAR(60)  NOT NULL,
  sort        INT          NOT NULL DEFAULT 0,
  gen         INT          NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_fixed_user (user_id),
  CONSTRAINT fk_fixed_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cada quincena, el recibo de un fijo queda enlazado al fijo que lo generó
-- (con su precio de ese momento: cambiar el fijo no toca quincenas anteriores).
SET @hay := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'expenses' AND COLUMN_NAME = 'fixed_id');
SET @sql := IF(@hay = 0, 'ALTER TABLE expenses ADD COLUMN fixed_id VARCHAR(32) NULL', 'SELECT 1');
PREPARE st FROM @sql;
EXECUTE st;
DEALLOCATE PREPARE st;
SET @hay := (SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fixed_expenses' AND COLUMN_NAME = 'gen');
SET @sql := IF(@hay = 0, 'ALTER TABLE fixed_expenses ADD COLUMN gen INT NULL', 'SELECT 1');
PREPARE st FROM @sql;
EXECUTE st;
DEALLOCATE PREPARE st;
