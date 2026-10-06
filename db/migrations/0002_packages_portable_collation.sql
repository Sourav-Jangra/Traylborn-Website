-- Tables created on MySQL 8 defaulted to utf8mb4_0900_ai_ci, which MariaDB (production)
-- does not reliably support. utf8mb4_unicode_ci exists on both engines.
-- Changes collation metadata only; row data is untouched. A no-op on fresh databases.

ALTER TABLE packages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
