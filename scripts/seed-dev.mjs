// Inserts the development sample packages from db/seed/dev-packages.json into a LOCAL
// database. Packages whose slug already exists are skipped, never overwritten, so admin
// edits survive re-runs. Run `npm run db:migrate` first.
// Usage: npm run db:seed
import { readFile } from "node:fs/promises";
import { connect, requireDatabaseEnv } from "./lib/db.mjs";

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

requireDatabaseEnv();
if (process.env.NODE_ENV === "production" || !LOCAL_HOSTS.includes(process.env.DATABASE_HOST)) {
  console.error(`Refusing to seed: the development seed only runs against a local database (DATABASE_HOST is "${process.env.DATABASE_HOST}").`);
  process.exit(1);
}

const packages = JSON.parse(await readFile(new URL("../db/seed/dev-packages.json", import.meta.url), "utf8"));
const conn = await connect();
try {
  const [tables] = await conn.query("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'packages'");
  if (!tables.length) throw new Error("The packages table does not exist. Run `npm run db:migrate` first.");

  let inserted = 0;
  for (const p of packages) {
    const [result] = await conn.execute(
      `INSERT IGNORE INTO packages (
         slug, title, tagline, category, region, state, destination, starting_point, ending_point,
         duration_days, nights, price, original_price, difficulty, max_altitude, distance,
         group_size, age_limit, description, video, featured, status, badge,
         images, highlights, itinerary, inclusions, exclusions, things_to_carry, faqs,
         best_season, tags, departure_rule
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.slug, p.title, p.tagline, p.category, p.region, p.state, p.destination, p.startingPoint, p.endingPoint,
        p.durationDays, p.nights, p.price, p.originalPrice ?? null, p.difficulty, p.maxAltitude ?? null, p.distance ?? null,
        p.groupSize, p.ageLimit, p.description, p.video ?? null, p.featured ? 1 : 0, p.status, p.badge ?? null,
        JSON.stringify(p.images), JSON.stringify(p.highlights), JSON.stringify(p.itinerary),
        JSON.stringify(p.inclusions), JSON.stringify(p.exclusions),
        p.thingsToCarry ? JSON.stringify(p.thingsToCarry) : null, JSON.stringify(p.faqs),
        JSON.stringify(p.bestSeason), JSON.stringify(p.tags), JSON.stringify(p.departureRule),
      ],
    );
    inserted += result.affectedRows;
  }
  console.log(`packages: ${inserted} inserted, ${packages.length - inserted} already present (left unchanged)`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
