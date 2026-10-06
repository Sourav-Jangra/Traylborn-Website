// Applies db/schema.sql and inserts the demo packages from db/seed/demo-packages.json.
// Existing rows (matched by slug) are left untouched, so admin edits survive re-runs.
// Usage: npm run db:setup
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const root = new URL("../", import.meta.url);

const conn = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  charset: "utf8mb4",
  multipleStatements: true,
});

try {
  await conn.query(await readFile(new URL("db/schema.sql", root), "utf8"));

  const packages = JSON.parse(await readFile(new URL("db/seed/demo-packages.json", root), "utf8"));
  let inserted = 0;
  for (const p of packages) {
    const [result] = await conn.execute(
      `INSERT IGNORE INTO packages (
         slug, title, tagline, category, region, state, destination, starting_point, ending_point,
         duration_days, nights, price, original_price, difficulty, max_altitude, distance,
         group_size, age_limit, description, video, departure_label, featured, status, badge,
         images, highlights, itinerary, inclusions, exclusions, things_to_carry, faqs,
         best_season, tags, departure_rule
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.slug, p.title, p.tagline, p.category, p.region, p.state, p.destination, p.startingPoint, p.endingPoint,
        p.durationDays, p.nights, p.price, p.originalPrice ?? null, p.difficulty, p.maxAltitude ?? null, p.distance ?? null,
        p.groupSize, p.ageLimit, p.description, p.video ?? null, p.departureLabel, p.featured ? 1 : 0, p.status, p.badge ?? null,
        JSON.stringify(p.images), JSON.stringify(p.highlights), JSON.stringify(p.itinerary),
        JSON.stringify(p.inclusions), JSON.stringify(p.exclusions),
        p.thingsToCarry ? JSON.stringify(p.thingsToCarry) : null, JSON.stringify(p.faqs),
        JSON.stringify(p.bestSeason), JSON.stringify(p.tags), JSON.stringify(p.departureRule),
      ],
    );
    inserted += result.affectedRows;
  }
  console.log(`packages: ${inserted} inserted, ${packages.length - inserted} already present`);
} finally {
  await conn.end();
}
