-- Who changed what. No foreign key to admin_users so history survives account changes.
-- Never store passwords, session tokens or payment secrets in before_data / after_data.

CREATE TABLE audit_log (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_type   ENUM('admin', 'system') NOT NULL,
  actor_id     INT UNSIGNED NULL,
  actor_label  VARCHAR(254) NOT NULL,
  action       VARCHAR(64) NOT NULL,
  entity_type  VARCHAR(64) NOT NULL,
  entity_id    VARCHAR(160) NULL,
  before_data  JSON NULL,
  after_data   JSON NULL,
  ip           VARCHAR(64) NULL,
  created_at   DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY audit_log_entity (entity_type, entity_id, created_at),
  KEY audit_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
