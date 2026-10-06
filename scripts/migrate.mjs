// Applies pending SQL migrations from db/migrations in order and records them in
// schema_migrations. Safe to run repeatedly: applied migrations are skipped.
//
// Usage:
//   npm run db:migrate            apply pending migrations
//   npm run db:migrate -- --status   list applied and pending migrations only
//
// Rules:
// - Migration files are named NNNN_description.sql and never edited once applied
//   (a checksum mismatch stops the runner).
// - Statements that can lose data (any DROP, TRUNCATE, DELETE FROM, RENAME, or a column
//   MODIFY/CHANGE) are refused unless the file starts with the line "-- allow-destructive".
// - A database that already has the pre-migration packages table adopts
//   0001_baseline_packages as applied instead of running it.
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { connect } from "./lib/db.mjs";

const MIGRATIONS_DIR = new URL("../db/migrations/", import.meta.url);
const FILE_PATTERN = /^(\d{4})_[a-z0-9_]+\.sql$/;
const DESTRUCTIVE = /\b(DROP|TRUNCATE|DELETE\s+FROM|RENAME|MODIFY|CHANGE)\b/i;

function withoutComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(--\s|#).*$/gm, " ");
}

const BASELINE_VERSION = 1;
const BASELINE_COLUMNS = [
  "id", "slug", "title", "tagline", "category", "region", "state", "destination", "starting_point",
  "ending_point", "duration_days", "nights", "price", "original_price", "difficulty", "max_altitude",
  "distance", "group_size", "age_limit", "description", "video", "departure_label", "featured", "status",
  "badge", "images", "highlights", "itinerary", "inclusions", "exclusions", "things_to_carry", "faqs",
  "best_season", "tags", "departure_rule", "created_at", "updated_at",
];

const statusOnly = process.argv.includes("--status");

async function loadMigrations() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  const seen = new Set();
  const migrations = [];
  for (const file of files) {
    const match = FILE_PATTERN.exec(file);
    if (!match) throw new Error(`Migration file name "${file}" must look like 0001_description.sql`);
    const version = Number(match[1]);
    if (seen.has(version)) throw new Error(`Two migration files share version ${match[1]}`);
    seen.add(version);
    const sql = (await readFile(new URL(file, MIGRATIONS_DIR), "utf8")).replace(/\r\n/g, "\n");
    const checksum = createHash("sha256").update(sql).digest("hex");
    if (DESTRUCTIVE.test(withoutComments(sql)) && !sql.startsWith("-- allow-destructive")) {
      throw new Error(`${file} contains a destructive statement. Mark it "-- allow-destructive" on line 1 only after review.`);
    }
    migrations.push({ version, name: file, sql, checksum });
  }
  return migrations;
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [table],
  );
  return rows.length > 0;
}

const conn = await connect({ multipleStatements: true });
let locked = false;
try {
  const [[{ acquired }]] = await conn.query("SELECT GET_LOCK('traylborn_migrations', 30) AS acquired");
  if (acquired !== 1) throw new Error("Another migration run holds the lock. Try again shortly.");
  locked = true;

  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version     INT UNSIGNED NOT NULL,
    name        VARCHAR(200) NOT NULL,
    checksum    CHAR(64) NOT NULL,
    adopted     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = existed before migrations; recorded, not run',
    applied_at  DATETIME NOT NULL,
    PRIMARY KEY (version)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  const migrations = await loadMigrations();
  const [appliedRows] = await conn.query("SELECT version, name, checksum, adopted FROM schema_migrations ORDER BY version");
  const applied = new Map(appliedRows.map((r) => [r.version, r]));

  for (const row of appliedRows) {
    const file = migrations.find((m) => m.version === row.version);
    if (!file) throw new Error(`Applied migration ${row.name} is missing from db/migrations.`);
    if (file.checksum !== row.checksum) {
      throw new Error(`${row.name} was edited after it was applied. Revert the edit and add a new migration instead.`);
    }
  }

  if (!applied.has(BASELINE_VERSION) && (await tableExists(conn, "packages"))) {
    const [cols] = await conn.query(
      "SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'packages'",
    );
    const present = new Set(cols.map((c) => c.name));
    const missing = BASELINE_COLUMNS.filter((c) => !present.has(c));
    if (missing.length) {
      throw new Error(`Existing packages table does not match the baseline (missing: ${missing.join(", ")}). Not adopting it.`);
    }
    const baseline = migrations.find((m) => m.version === BASELINE_VERSION);
    if (statusOnly) {
      applied.set(BASELINE_VERSION, { willAdopt: true });
    } else {
      await conn.query(
        "INSERT INTO schema_migrations (version, name, checksum, adopted, applied_at) VALUES (?, ?, ?, 1, UTC_TIMESTAMP())",
        [baseline.version, baseline.name, baseline.checksum],
      );
      applied.set(BASELINE_VERSION, { adopted: 1 });
      console.log(`Adopted ${baseline.name}: the existing packages table was recorded as the baseline (not recreated).`);
    }
  }

  const pending = migrations.filter((m) => !applied.has(m.version));
  if (statusOnly) {
    for (const m of migrations) {
      const row = applied.get(m.version);
      const state = !row ? "pending" : row.willAdopt ? "will adopt existing table" : row.adopted ? "adopted" : "applied";
      console.log(`  ${state.padEnd(8)}  ${m.name}`);
    }
  } else if (pending.length === 0) {
    console.log("Database is up to date. Nothing to apply.");
  } else {
    for (const m of pending) {
      try {
        await conn.query(m.sql);
      } catch (e) {
        throw new Error(`${m.name} failed: ${e.message}. Statements before the failure may have been applied; inspect the database before re-running.`);
      }
      await conn.query(
        "INSERT INTO schema_migrations (version, name, checksum, adopted, applied_at) VALUES (?, ?, ?, 0, UTC_TIMESTAMP())",
        [m.version, m.name, m.checksum],
      );
      console.log(`Applied ${m.name}`);
    }
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  if (locked) await conn.query("SELECT RELEASE_LOCK('traylborn_migrations')").catch(() => {});
  await conn.end();
}
