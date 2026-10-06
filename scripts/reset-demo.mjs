// Restores the local demo database to the baseline in db/seed/demo-packages.json:
// removes any other packages and overwrites the demo packages with their seed content.
// Usage: npm run db:reset-demo
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const DEMO_DATABASE = "traylborn_app";
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

const { DATABASE_HOST, DATABASE_NAME } = process.env;
if (!LOCAL_HOSTS.includes(DATABASE_HOST ?? "")) {
  console.error(`Refusing to reset: DATABASE_HOST "${DATABASE_HOST}" is not a local host.`);
  process.exit(1);
}
if (DATABASE_NAME !== DEMO_DATABASE) {
  console.error(`Refusing to reset: DATABASE_NAME "${DATABASE_NAME}" is not the demo database "${DEMO_DATABASE}".`);
  process.exit(1);
}

const root = new URL("../", import.meta.url);
const seed = JSON.parse(await readFile(new URL("db/seed/demo-packages.json", root), "utf8"));

const columns = {
  slug: (p) => p.slug,
  title: (p) => p.title,
  tagline: (p) => p.tagline,
  category: (p) => p.category,
  region: (p) => p.region,
  state: (p) => p.state,
  destination: (p) => p.destination,
  starting_point: (p) => p.startingPoint,
  ending_point: (p) => p.endingPoint,
  duration_days: (p) => p.durationDays,
  nights: (p) => p.nights,
  price: (p) => p.price,
  original_price: (p) => p.originalPrice ?? null,
  difficulty: (p) => p.difficulty,
  max_altitude: (p) => p.maxAltitude ?? null,
  distance: (p) => p.distance ?? null,
  group_size: (p) => p.groupSize,
  age_limit: (p) => p.ageLimit,
  description: (p) => p.description,
  video: (p) => p.video ?? null,
  departure_label: (p) => p.departureLabel,
  featured: (p) => (p.featured ? 1 : 0),
  status: (p) => p.status,
  badge: (p) => p.badge ?? null,
  images: (p) => JSON.stringify(p.images),
  highlights: (p) => JSON.stringify(p.highlights),
  itinerary: (p) => JSON.stringify(p.itinerary),
  inclusions: (p) => JSON.stringify(p.inclusions),
  exclusions: (p) => JSON.stringify(p.exclusions),
  things_to_carry: (p) => (p.thingsToCarry ? JSON.stringify(p.thingsToCarry) : null),
  faqs: (p) => JSON.stringify(p.faqs),
  best_season: (p) => JSON.stringify(p.bestSeason),
  tags: (p) => JSON.stringify(p.tags),
  departure_rule: (p) => JSON.stringify(p.departureRule),
};
const names = Object.keys(columns);
const upsert = `INSERT INTO packages (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")}) AS seed
  ON DUPLICATE KEY UPDATE ${names.filter((n) => n !== "slug").map((n) => `${n} = seed.${n}`).join(", ")}`;

const conn = await mysql.createConnection({
  host: DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: DATABASE_NAME,
  charset: "utf8mb4",
});

try {
  const [tables] = await conn.query("SHOW TABLES");
  const tableNames = tables.map((t) => Object.values(t)[0]);
  if (tableNames.some((t) => t !== "packages")) {
    throw new Error(`Refusing to reset: unexpected tables in ${DATABASE_NAME}: ${tableNames.join(", ")}`);
  }

  const slugs = seed.map((p) => p.slug);
  await conn.beginTransaction();
  const [removed] = await conn.query("DELETE FROM packages WHERE slug NOT IN (?)", [slugs]);
  for (const p of seed) await conn.execute(upsert, names.map((n) => columns[n](p)));
  await conn.commit();

  const [[{ next }]] = await conn.query("SELECT COALESCE(MAX(id), 0) + 1 AS next FROM packages");
  await conn.query(`ALTER TABLE packages AUTO_INCREMENT = ${Number(next)}`);

  const [rows] = await conn.query("SELECT slug, price, status, featured FROM packages ORDER BY id");
  const mismatched = seed.filter((p) => {
    const r = rows.find((x) => x.slug === p.slug);
    return !r || r.price !== p.price || r.status !== p.status || Boolean(r.featured) !== Boolean(p.featured);
  });
  console.log(`Removed ${removed.affectedRows} non-demo package(s); restored ${seed.length} demo package(s).`);
  for (const r of rows) console.log(`  ${r.slug.padEnd(26)} ₹${r.price}  ${r.status}  ${r.featured ? "featured" : "not featured"}`);
  if (rows.length !== seed.length || mismatched.length) throw new Error("Reset verification failed");
  console.log("Demo database matches the baseline.");
  console.log("If a production server (next start) is running, run `npm run build` and restart it — its cached pages don't see direct database changes. `next dev` needs nothing.");
} catch (e) {
  await conn.rollback().catch(() => {});
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
