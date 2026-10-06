-- Guest bookings created at checkout, before any payment.
--
-- Prices, totals and the advance due are computed by the server (quotePrice in
-- src/lib/utils/pricing.ts) when the booking is created and stored here in paise. They are
-- never recalculated from the package afterwards, so later price edits don't change a
-- booking. package_title, option_label and the advance terms are copies taken at the same
-- moment for the same reason.
--
-- status 'pending_payment' bookings past expires_at are treated as expired whenever they
-- are read; nothing depends on a background job rewriting them.
-- Contact details live on the primary row of booking_travellers, not here.

CREATE TABLE bookings (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference            VARCHAR(16) NOT NULL,
  access_token_hash    CHAR(64) NOT NULL COMMENT 'sha256 of the secret guest link token',
  idempotency_key      CHAR(36) NOT NULL,
  source               ENUM('website', 'admin') NOT NULL DEFAULT 'website',
  package_id           INT UNSIGNED NOT NULL,
  price_option_id      INT UNSIGNED NULL COMMENT 'NULL once the option is removed from the package',
  package_title        VARCHAR(200) NOT NULL,
  option_label         VARCHAR(80) NOT NULL,
  departure_date       DATE NOT NULL,
  end_date             DATE NOT NULL,
  traveller_count      TINYINT UNSIGNED NOT NULL,
  unit_price_paise     BIGINT UNSIGNED NOT NULL,
  subtotal_paise       BIGINT UNSIGNED NOT NULL,
  discount_paise       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  total_paise          BIGINT UNSIGNED NOT NULL,
  payment_plan         ENUM('full', 'advance') NOT NULL,
  advance_type         ENUM('percent', 'fixed') NULL COMMENT 'advance terms offered at booking time; NULL when none',
  advance_value        INT UNSIGNED NULL,
  amount_due_now_paise BIGINT UNSIGNED NOT NULL,
  status               ENUM('pending_payment', 'confirmed', 'cancelled', 'expired', 'completed') NOT NULL DEFAULT 'pending_payment',
  payment_status       ENUM('unpaid', 'partially_paid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  expires_at           DATETIME NULL,
  customer_notes       TEXT NULL,
  admin_notes          TEXT NULL,
  created_ip           VARCHAR(64) NULL,
  confirmed_at         DATETIME NULL,
  completed_at         DATETIME NULL,
  cancelled_at         DATETIME NULL,
  cancellation_reason  VARCHAR(500) NULL,
  created_at           DATETIME NOT NULL,
  updated_at           DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY bookings_reference (reference),
  UNIQUE KEY bookings_access_token (access_token_hash),
  UNIQUE KEY bookings_idempotency (idempotency_key),
  KEY bookings_created (created_at),
  KEY bookings_status (status, created_at),
  KEY bookings_departure (package_id, departure_date),
  KEY bookings_ip (created_ip, created_at),
  CONSTRAINT bookings_package_fk FOREIGN KEY (package_id) REFERENCES packages (id),
  CONSTRAINT bookings_price_option_fk FOREIGN KEY (price_option_id) REFERENCES package_price_options (id) ON DELETE SET NULL,
  CONSTRAINT bookings_traveller_count CHECK (traveller_count BETWEEN 1 AND 25),
  CONSTRAINT bookings_totals CHECK (total_paise = subtotal_paise - discount_paise AND amount_due_now_paise <= total_paise)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per traveller. position 1 is the primary booker (is_primary = 1), who must have
-- email, phone, city and an emergency contact; the server enforces that.
CREATE TABLE booking_travellers (
  id                       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id               INT UNSIGNED NOT NULL,
  position                 TINYINT UNSIGNED NOT NULL,
  is_primary               TINYINT(1) NOT NULL DEFAULT 0,
  full_name                VARCHAR(120) NOT NULL,
  age                      TINYINT UNSIGNED NOT NULL,
  email                    VARCHAR(254) NULL,
  phone                    VARCHAR(32) NULL,
  city                     VARCHAR(120) NULL,
  emergency_contact_name   VARCHAR(120) NULL,
  emergency_contact_phone  VARCHAR(32) NULL,
  created_at               DATETIME NOT NULL,
  updated_at               DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY booking_travellers_position (booking_id, position),
  KEY booking_travellers_email (email),
  CONSTRAINT booking_travellers_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
  CONSTRAINT booking_travellers_age CHECK (age BETWEEN 1 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
