-- Coupons and scheduled offers.
--
-- Discounts are calculated only by quotePrice (src/lib/utils/pricing.ts). A booking gets at
-- most one discount: the larger of the best live offer for its package and the coupon the
-- customer entered. What was applied is copied onto the booking (source, label, type,
-- value, code) next to the existing subtotal/discount/total columns, so editing or deleting
-- a coupon or offer later never changes an existing booking.
--
-- Dates are calendar days in India time and both ends are inclusive. A coupon with no dates
-- is valid whenever it is active; an offer always has a start and an end.
--
-- coupon_checks records failed coupon lookups per IP so codes can't be guessed by brute
-- force.
--
-- Every statement is safe to run again: tables use IF NOT EXISTS and the bookings columns
-- are added only when missing.

CREATE TABLE IF NOT EXISTS coupons (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code            VARCHAR(32) NOT NULL COMMENT 'stored upper case',
  description     VARCHAR(200) NOT NULL DEFAULT '' COMMENT 'internal note for admins',
  discount_type   ENUM('percent', 'fixed') NOT NULL,
  discount_value  INT UNSIGNED NOT NULL COMMENT 'percent 1-99, or rupees off the booking',
  package_id      INT UNSIGNED NULL COMMENT 'NULL = every package',
  starts_on       DATE NULL,
  ends_on         DATE NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME NOT NULL,
  updated_at      DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY coupons_code (code),
  KEY coupons_package (package_id),
  CONSTRAINT coupons_package_fk FOREIGN KEY (package_id) REFERENCES packages (id),
  CONSTRAINT coupons_value CHECK (discount_value > 0 AND (discount_type = 'fixed' OR discount_value <= 99)),
  CONSTRAINT coupons_dates CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offers (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title             VARCHAR(120) NOT NULL COMMENT 'shown to customers',
  description       VARCHAR(300) NOT NULL DEFAULT '',
  discount_type     ENUM('percent', 'fixed') NOT NULL,
  discount_value    INT UNSIGNED NOT NULL,
  package_id        INT UNSIGNED NULL COMMENT 'NULL = every package',
  starts_on         DATE NOT NULL,
  ends_on           DATE NOT NULL,
  is_active         TINYINT(1) NOT NULL DEFAULT 0,
  show_on_homepage  TINYINT(1) NOT NULL DEFAULT 1,
  created_at        DATETIME NOT NULL,
  updated_at        DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY offers_live (is_active, starts_on, ends_on),
  KEY offers_package (package_id),
  CONSTRAINT offers_package_fk FOREIGN KEY (package_id) REFERENCES packages (id),
  CONSTRAINT offers_value CHECK (discount_value > 0 AND (discount_type = 'fixed' OR discount_value <= 99)),
  CONSTRAINT offers_dates CHECK (ends_on >= starts_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupon_checks (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ip          VARCHAR(64) NOT NULL,
  created_at  DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY coupon_checks_ip (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The discount applied to a booking, copied at booking time. discount_paise already exists.
SET @add_booking_discount = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE bookings
       ADD COLUMN discount_source ENUM(''offer'', ''coupon'') NULL AFTER discount_paise,
       ADD COLUMN discount_label VARCHAR(160) NULL AFTER discount_source,
       ADD COLUMN discount_type ENUM(''percent'', ''fixed'') NULL AFTER discount_label,
       ADD COLUMN discount_value INT UNSIGNED NULL AFTER discount_type,
       ADD COLUMN coupon_id INT UNSIGNED NULL AFTER discount_value,
       ADD COLUMN coupon_code VARCHAR(32) NULL AFTER coupon_id,
       ADD COLUMN offer_id INT UNSIGNED NULL AFTER coupon_code,
       ADD CONSTRAINT bookings_coupon_fk FOREIGN KEY (coupon_id) REFERENCES coupons (id) ON DELETE SET NULL,
       ADD CONSTRAINT bookings_offer_fk FOREIGN KEY (offer_id) REFERENCES offers (id) ON DELETE SET NULL',
    'DO 0')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'discount_source'
);
PREPARE add_booking_discount FROM @add_booking_discount;
EXECUTE add_booking_discount;
DEALLOCATE PREPARE add_booking_discount;
