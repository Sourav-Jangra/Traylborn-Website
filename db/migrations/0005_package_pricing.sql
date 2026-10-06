-- Pricing options and advance-payment settings per package.
--
-- package_price_options is the source of truth for prices. packages.price is kept as a
-- denormalised copy of the package's lowest option price ("starting from"), rewritten by
-- the server in the same transaction as the options. Application code never reads it.
-- Exactly one option per package is the default; the server enforces this.

CREATE TABLE package_price_options (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  package_id  INT UNSIGNED NOT NULL,
  label       VARCHAR(80) NOT NULL,
  price       INT UNSIGNED NOT NULL COMMENT 'INR per traveller',
  is_default  TINYINT(1) NOT NULL DEFAULT 0,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL,
  updated_at  DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY package_price_options_label (package_id, label),
  KEY package_price_options_order (package_id, sort_order),
  CONSTRAINT package_price_options_package_fk FOREIGN KEY (package_id) REFERENCES packages (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- advance_value is a whole percentage (1-99) when advance_type is 'percent', or INR per
-- traveller when it is 'fixed'.
ALTER TABLE packages
  ADD COLUMN advance_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER original_price,
  ADD COLUMN advance_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent' AFTER advance_enabled,
  ADD COLUMN advance_value INT UNSIGNED NOT NULL DEFAULT 0 AFTER advance_type;

-- Every existing package keeps its current single price as its default option.
INSERT INTO package_price_options (package_id, label, price, is_default, sort_order, created_at, updated_at)
SELECT id, 'Standard', price, 1, 0, UTC_TIMESTAMP(), UTC_TIMESTAMP() FROM packages;
