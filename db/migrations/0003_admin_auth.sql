-- Admin sign-in. All DATETIME values are UTC.

CREATE TABLE admin_users (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email                VARCHAR(254) NOT NULL,
  name                 VARCHAR(120) NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,
  is_active            TINYINT(1) NOT NULL DEFAULT 1,
  password_changed_at  DATETIME NULL,
  last_login_at        DATETIME NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY admin_users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Only a SHA-256 hash of the session token is stored; the token itself lives in the cookie.
CREATE TABLE admin_sessions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_user_id  INT UNSIGNED NOT NULL,
  token_hash     CHAR(64) NOT NULL,
  created_at     DATETIME NOT NULL,
  last_seen_at   DATETIME NOT NULL,
  expires_at     DATETIME NOT NULL,
  ip             VARCHAR(64) NULL,
  user_agent     VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY admin_sessions_token_hash_unique (token_hash),
  KEY admin_sessions_user (admin_user_id),
  KEY admin_sessions_expires (expires_at),
  CONSTRAINT admin_sessions_user_fk FOREIGN KEY (admin_user_id) REFERENCES admin_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_login_attempts (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(254) NOT NULL,
  ip            VARCHAR(64) NULL,
  succeeded     TINYINT(1) NOT NULL,
  attempted_at  DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY admin_login_attempts_email (email, attempted_at),
  KEY admin_login_attempts_ip (ip, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
