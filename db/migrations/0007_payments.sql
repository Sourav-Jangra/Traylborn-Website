-- Payments ledger and Razorpay webhook log.
--
-- payments has one row per online payment attempt (one Razorpay order). A row starts as
-- 'created' when the order is made, becomes 'captured' once Razorpay confirms the money was
-- taken (checked server-side against Razorpay's API or a signed webhook), or 'failed' when
-- Razorpay reports the attempt failed; a failed order can still be paid on a later try.
-- The method column already allows offline methods and kind allows refunds so later
-- admin-recorded entries live in the same ledger.
--
-- bookings.amount_paid_paise is a cache of captured payments minus refunds, rewritten in
-- the same transaction as every ledger change. payment_status is derived from it.

CREATE TABLE payments (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id             INT UNSIGNED NOT NULL,
  kind                   ENUM('payment', 'refund') NOT NULL DEFAULT 'payment',
  method                 ENUM('razorpay', 'cash', 'upi_direct', 'bank_transfer', 'other') NOT NULL,
  status                 ENUM('created', 'captured', 'failed') NOT NULL,
  amount_paise           BIGINT UNSIGNED NOT NULL COMMENT 'amount requested; for captured rows, the amount Razorpay reports',
  currency               CHAR(3) NOT NULL DEFAULT 'INR',
  razorpay_order_id      VARCHAR(40) NULL,
  razorpay_payment_id    VARCHAR(40) NULL,
  provider_method        VARCHAR(30) NULL COMMENT 'card, upi, netbanking… as reported by Razorpay',
  signature_verified     TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'checkout signature checked; webhook-only captures stay 0',
  captured_via           ENUM('checkout', 'webhook') NULL,
  after_expiry           TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'captured after the booking hold had expired',
  error_code             VARCHAR(64) NULL,
  error_description      VARCHAR(500) NULL,
  received_at            DATETIME NULL,
  created_at             DATETIME NOT NULL,
  updated_at             DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY payments_razorpay_order (razorpay_order_id),
  UNIQUE KEY payments_razorpay_payment (razorpay_payment_id),
  KEY payments_booking (booking_id, created_at),
  CONSTRAINT payments_booking_fk FOREIGN KEY (booking_id) REFERENCES bookings (id),
  CONSTRAINT payments_amount CHECK (amount_paise > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Every webhook delivery whose signature checked out, keyed by Razorpay's event id so a
-- redelivered event is recognised and not applied twice. Deliveries with a bad signature
-- are rejected without being stored.
CREATE TABLE payment_webhook_events (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_event_id   VARCHAR(64) NOT NULL,
  event_type          VARCHAR(64) NOT NULL,
  razorpay_order_id   VARCHAR(40) NULL,
  razorpay_payment_id VARCHAR(40) NULL,
  payload             JSON NOT NULL,
  received_at         DATETIME NOT NULL,
  processed_at        DATETIME NULL,
  outcome             VARCHAR(64) NULL,
  error               VARCHAR(500) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY payment_webhook_events_event (provider_event_id),
  KEY payment_webhook_events_payment (razorpay_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE bookings
  ADD COLUMN amount_paid_paise BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER amount_due_now_paise;
