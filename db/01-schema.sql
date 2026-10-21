-- Spentry — esquema MySQL 8 (utf8mb4). Se aplica a la BD `spentry` (local y acmsy).
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(190)  NOT NULL,
  password_hash VARCHAR(255)  NULL,
  google_id     VARCHAR(255)  NULL,
  photo         MEDIUMTEXT    NULL,
  initials      VARCHAR(8)    NOT NULL DEFAULT '',
  moneda        VARCHAR(8)    NOT NULL DEFAULT 'COP',
  budget        BIGINT        NOT NULL DEFAULT 0,      -- presupuesto por quincena (0 = sin presupuesto)
  remind_daily  TINYINT(1)    NOT NULL DEFAULT 1,      -- recordatorio push diario
  remind_hour   TINYINT       NOT NULL DEFAULT 20,     -- hora local (Colombia) del recordatorio
  reminded_on   DATE          NULL,                    -- último día que se envió el recordatorio
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categorías por usuario (arrancan con un set por defecto al registrarse).
CREATE TABLE IF NOT EXISTS categories (
  user_id    INT UNSIGNED NOT NULL,
  id         VARCHAR(60)  NOT NULL,
  label      VARCHAR(80)  NOT NULL,
  icon       VARCHAR(30)  NOT NULL DEFAULT 'tag',
  color      VARCHAR(16)  NOT NULL DEFAULT '#96D15A',
  sort       INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, id),
  CONSTRAINT fk_cat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gastos. Cada uno es un "recibo" con folio consecutivo por usuario.
CREATE TABLE IF NOT EXISTS expenses (
  id          VARCHAR(32)  NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  folio       INT UNSIGNED NOT NULL DEFAULT 0,
  amount      BIGINT       NOT NULL,
  currency    VARCHAR(8)   NOT NULL DEFAULT 'COP',
  category    VARCHAR(60)  NOT NULL,
  note        VARCHAR(200) NULL,
  spent_on    DATE         NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_exp_user_date (user_id, spent_on),
  CONSTRAINT fk_exp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Espejo para el panel de acmsy (lee auth_users/auth_logins).
CREATE TABLE IF NOT EXISTS auth_users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  VARCHAR(255),
  name           VARCHAR(255),
  google_id      VARCHAR(255),
  email_verified TINYINT(1) DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at  DATETIME NULL,
  last_seen_at   DATETIME NULL,
  login_count    INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_logins (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  method     VARCHAR(40),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_auth_logins_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Web Push (recordatorio diario para anotar los gastos).
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            VARCHAR(36)  NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  endpoint_hash CHAR(64)     NOT NULL,
  endpoint      TEXT         NOT NULL,
  p256dh        VARCHAR(255) NOT NULL,
  auth          VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_push_endpoint (endpoint_hash),
  KEY idx_push_user (user_id),
  CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
