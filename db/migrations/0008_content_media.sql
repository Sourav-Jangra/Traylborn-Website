-- Homepage content and media library.
--
-- media_assets is the library every content block picks images and videos from. Local rows
-- point at files shipped in /public/images; Cloudinary rows hold the delivery URL plus the
-- public id so transformations can be built later.
--
-- home_hero_slides and home_promos are ordered lists an admin can switch on and off.
-- content_sections holds the fixed homepage sections (one row each, keyed by section_key)
-- as JSON validated by the app against src/lib/content/schema.ts.
--
-- The seeded rows are the homepage copy and images that were hardcoded before this
-- migration, so the site looks the same once it runs.
--
-- Every statement is safe to run again: tables use IF NOT EXISTS, seeds use INSERT IGNORE
-- with fixed ids or keys, and the packages column is added only when missing.

CREATE TABLE IF NOT EXISTS media_assets (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider              ENUM('local', 'cloudinary') NOT NULL,
  resource_type         ENUM('image', 'video') NOT NULL,
  src                   VARCHAR(500) NOT NULL COMMENT '/images/... for local files, https delivery URL for Cloudinary',
  cloudinary_public_id  VARCHAR(255) NULL,
  alt_text              VARCHAR(300) NOT NULL DEFAULT '',
  label                 VARCHAR(160) NOT NULL DEFAULT '',
  width                 INT UNSIGNED NULL,
  height                INT UNSIGNED NULL,
  created_at            DATETIME NOT NULL,
  updated_at            DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY media_assets_src (src),
  CONSTRAINT media_assets_cloudinary CHECK (provider = 'local' OR cloudinary_public_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS home_hero_slides (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  eyebrow               VARCHAR(120) NOT NULL DEFAULT '',
  title                 VARCHAR(160) NOT NULL,
  subtitle              VARCHAR(400) NOT NULL DEFAULT '',
  image_id              INT UNSIGNED NOT NULL,
  video_id              INT UNSIGNED NULL,
  cta_label             VARCHAR(40) NOT NULL DEFAULT '',
  cta_href              VARCHAR(300) NOT NULL DEFAULT '',
  secondary_cta_label   VARCHAR(40) NOT NULL DEFAULT '',
  secondary_cta_href    VARCHAR(300) NOT NULL DEFAULT '',
  is_active             TINYINT(1) NOT NULL DEFAULT 0,
  sort_order            SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at            DATETIME NOT NULL,
  updated_at            DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY home_hero_slides_order (is_active, sort_order),
  CONSTRAINT home_hero_slides_image_fk FOREIGN KEY (image_id) REFERENCES media_assets (id),
  CONSTRAINT home_hero_slides_video_fk FOREIGN KEY (video_id) REFERENCES media_assets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS home_promos (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  eyebrow               VARCHAR(60) NOT NULL DEFAULT '',
  title                 VARCHAR(160) NOT NULL,
  body                  VARCHAR(600) NOT NULL DEFAULT '',
  media_id              INT UNSIGNED NULL,
  cta_label             VARCHAR(40) NOT NULL DEFAULT '',
  cta_href              VARCHAR(300) NOT NULL DEFAULT '',
  is_active             TINYINT(1) NOT NULL DEFAULT 0,
  sort_order            SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at            DATETIME NOT NULL,
  updated_at            DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY home_promos_order (is_active, sort_order),
  CONSTRAINT home_promos_media_fk FOREIGN KEY (media_id) REFERENCES media_assets (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_sections (
  section_key   VARCHAR(64) NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  data          JSON NOT NULL,
  updated_at    DATETIME NOT NULL,
  PRIMARY KEY (section_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO media_assets (id, provider, resource_type, src, alt_text, label, created_at, updated_at) VALUES
  (1, 'local', 'image', '/images/hero/himalaya-sunrise.jpg', 'Sunrise over snow-capped Himalayan peaks above a sea of clouds', 'Himalaya sunrise', UTC_TIMESTAMP(), UTC_TIMESTAMP()),
  (2, 'local', 'image', '/images/treks/homestay-group.jpg', 'A Traylborn trekking group smiling outside a wooden mountain homestay', 'Homestay group', UTC_TIMESTAMP(), UTC_TIMESTAMP()),
  (3, 'local', 'image', '/images/treks/sunrise-silhouette.jpg', 'A trekker silhouetted above a sea of clouds at sunrise', 'Sunrise silhouette', UTC_TIMESTAMP(), UTC_TIMESTAMP());

INSERT IGNORE INTO home_hero_slides
  (id, eyebrow, title, subtitle, image_id, video_id, cta_label, cta_href, secondary_cta_label, secondary_cta_href, is_active, sort_order, created_at, updated_at)
VALUES
  (1, 'Born of trails · Made for journeys', CONCAT('Go further.', CHAR(10 USING utf8mb4), 'Come back with *stories.*'),
   'Himalayan treks, road expeditions and mountain retreats — planned end-to-end by a Chandigarh-based team.',
   1, NULL, 'Explore Journeys', '/treks', 'Plan Your Trip', '/contact', 1, 0, UTC_TIMESTAMP(), UTC_TIMESTAMP());

INSERT IGNORE INTO content_sections (section_key, is_active, data, updated_at) VALUES
  ('home.trust_bar', 1, '{"items": [{"icon": "map-pin", "label": "Chandigarh-based team"}, {"icon": "users", "label": "Up to 25 travellers per booking"}, {"icon": "receipt", "label": "Clear inclusions & exclusions"}, {"icon": "message", "label": "Talk to us on WhatsApp"}]}', UTC_TIMESTAMP()),
  ('home.featured', 1, '{"eyebrow": "Upcoming departures", "title": "Journeys our travellers *love*", "description": "Hand-picked journeys with departures this season."}', UTC_TIMESTAMP()),
  ('home.categories', 1, '{"eyebrow": "Explore by experience", "title": "Three ways to *find your trail*", "description": "Whether you want to stand on a summit, drive over the world''s highest passes, or simply breathe — there''s a Traylborn journey for it."}', UTC_TIMESTAMP()),
  ('home.spotlight', 1, '{"packageSlug": "hampta-pass-chandratal", "badge": "Journey of the season", "title": "Green valleys to *moon deserts* in five days."}', UTC_TIMESTAMP()),
  ('home.why', 1, '{"eyebrow": "Why Traylborn", "title": "Not just treks. *Life-changing* journeys.", "description": "Adventure designed for real explorers, planned by a Chandigarh-based team.", "imageId": 2, "pillars": [{"icon": "compass", "title": "Diverse experiences", "body": "Himalayan treks, winter road expeditions and yoga retreats — journeys for adventurers, wellness seekers and nature lovers."}, {"icon": "shield", "title": "Safety & comfort first", "body": "Safety is planned into every departure — from the route and the pace to the stays and transport."}, {"icon": "receipt", "title": "Transparent pricing", "body": "Clear inclusions and exclusions on every journey page, so you know what you''re paying for."}, {"icon": "headset", "title": "Support, start to finish", "body": "Packing lists before you go, help on the ground, and a real person on WhatsApp whenever you have a question."}]}', UTC_TIMESTAMP()),
  ('home.final_cta', 1, '{"eyebrow": "Ready when you are", "title": "Your next story *starts here.*", "body": "Pick a journey, choose your dates, and we''ll handle everything else — from packing lists to the last summit photo.", "imageId": 3, "ctaLabel": "Explore Journeys", "ctaHref": "/treks", "whatsappLabel": "Talk to Traylborn", "whatsappMessage": "Hi Traylborn! I''d like help planning a trip."}', UTC_TIMESTAMP());

-- Homepage order of featured packages (lower first). Added only if missing so a re-run is harmless.
SET @add_featured_sort = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE packages ADD COLUMN featured_sort SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER featured',
    'DO 0')
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'packages' AND COLUMN_NAME = 'featured_sort'
);
PREPARE add_featured_sort FROM @add_featured_sort;
EXECUTE add_featured_sort;
DEALLOCATE PREPARE add_featured_sort;
