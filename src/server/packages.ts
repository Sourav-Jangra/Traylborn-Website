import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  Category,
  DepartureRule,
  Difficulty,
  FAQ,
  ItineraryDay,
  PackageImage,
  PackageStatus,
  Season,
  TravelPackage,
} from "@/lib/types";
import { describeDepartures } from "@/lib/utils/departures";
import { recordAudit, diff, type Actor } from "./audit";
import { db, parseJson, withTransaction } from "./db";

/** JSON columns arrive as text (see db.ts) and are parsed in toPackage. */
interface PackageRow extends RowDataPacket {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  category: Category;
  region: string;
  state: string;
  destination: string;
  starting_point: string;
  ending_point: string;
  duration_days: number;
  nights: number;
  price: number;
  original_price: number | null;
  difficulty: Difficulty;
  max_altitude: string | null;
  distance: string | null;
  group_size: string;
  age_limit: string;
  description: string;
  video: string | null;
  featured: number;
  status: PackageStatus;
  badge: string | null;
  images: string;
  highlights: string;
  itinerary: string;
  inclusions: string;
  exclusions: string;
  things_to_carry: string | null;
  faqs: string;
  best_season: string;
  tags: string;
  departure_rule: string;
}

function toPackage(row: PackageRow): TravelPackage {
  const departureRule = parseJson<DepartureRule>(row.departure_rule);
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    category: row.category,
    region: row.region,
    state: row.state,
    destination: row.destination,
    startingPoint: row.starting_point,
    endingPoint: row.ending_point,
    durationDays: row.duration_days,
    nights: row.nights,
    price: row.price,
    originalPrice: row.original_price ?? undefined,
    // Reviews are not stored yet; the UI hides ratings when the count is 0.
    rating: 0,
    reviewCount: 0,
    difficulty: row.difficulty,
    maxAltitude: row.max_altitude ?? undefined,
    distance: row.distance ?? undefined,
    bestSeason: parseJson<Season[]>(row.best_season),
    groupSize: row.group_size,
    ageLimit: row.age_limit,
    images: parseJson<PackageImage[]>(row.images),
    video: row.video ?? undefined,
    description: row.description,
    highlights: parseJson<string[]>(row.highlights),
    itinerary: parseJson<ItineraryDay[]>(row.itinerary),
    inclusions: parseJson<string[]>(row.inclusions),
    exclusions: parseJson<string[]>(row.exclusions),
    thingsToCarry: row.things_to_carry === null ? undefined : parseJson<string[]>(row.things_to_carry),
    faqs: parseJson<FAQ[]>(row.faqs),
    departureRule,
    departureLabel: describeDepartures(departureRule),
    featured: Boolean(row.featured),
    status: row.status,
    tags: parseJson<string[]>(row.tags),
    badge: row.badge ?? undefined,
  };
}

/**
 * Package data is read per request, never baked into a prerendered page: a cached
 * render that reads MySQL just before an admin save can be written back after the
 * save's revalidation and then be served as fresh. Availability also depends on
 * today's date.
 */
async function query(sql: string, params: unknown[] = []) {
  await connection();
  const [rows] = await db.query<PackageRow[]>(sql, params);
  return rows.map(toPackage);
}

/** Every package regardless of status — admin only. */
export const getAllPackages = cache(() => query("SELECT * FROM packages ORDER BY featured DESC, title"));

export const getPublishedPackages = cache(() =>
  query("SELECT * FROM packages WHERE status = 'published' ORDER BY featured DESC, title"),
);

export async function getPackageBySlug(slug: string) {
  return (await getPublishedPackages()).find((p) => p.slug === slug);
}

export async function getPackageForAdmin(slug: string) {
  return (await getAllPackages()).find((p) => p.slug === slug);
}

export async function getPackagesByCategory(category: Category) {
  return (await getPublishedPackages()).filter((p) => p.category === category);
}

export async function getFeaturedPackages() {
  return (await getPublishedPackages()).filter((p) => p.featured);
}

export async function getRelatedPackages(pkg: TravelPackage, limit = 3) {
  return (await getPublishedPackages())
    .filter((p) => p.slug !== pkg.slug)
    .sort((a, b) => Number(b.category === pkg.category) - Number(a.category === pkg.category))
    .slice(0, limit);
}

export interface PackageUpdate {
  title: string;
  tagline: string;
  category: Category;
  region: string;
  durationDays: number;
  nights: number;
  difficulty: Difficulty;
  startingPoint: string;
  endingPoint: string;
  groupSize: string;
  price: number;
  originalPrice: number | null;
  images: PackageImage[];
  description: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  departureRule: DepartureRule;
  featured: boolean;
  status: PackageStatus;
  badge: string | null;
}

/** The admin-editable fields of a stored package, in PackageUpdate shape, for audit entries. */
function editableFields(row: PackageRow): PackageUpdate {
  const p = toPackage(row);
  return {
    title: p.title,
    tagline: p.tagline,
    category: p.category,
    region: p.region,
    durationDays: p.durationDays,
    nights: p.nights,
    difficulty: p.difficulty,
    startingPoint: p.startingPoint,
    endingPoint: p.endingPoint,
    groupSize: p.groupSize,
    price: p.price,
    originalPrice: p.originalPrice ?? null,
    images: p.images,
    description: p.description,
    highlights: p.highlights,
    inclusions: p.inclusions,
    exclusions: p.exclusions,
    itinerary: p.itinerary,
    departureRule: p.departureRule,
    featured: p.featured,
    status: p.status,
    badge: p.badge ?? null,
  };
}

async function lockPackage(conn: PoolConnection, slug: string) {
  const [rows] = await conn.query<PackageRow[]>("SELECT * FROM packages WHERE slug = ? FOR UPDATE", [slug]);
  return rows[0];
}

/** Returns false when the slug is already taken. */
export async function createPackage(slug: string, u: PackageUpdate, actor: Actor) {
  try {
    await withTransaction(async (conn) => {
      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO packages (
           slug, title, tagline, category, region, duration_days, nights,
           difficulty, starting_point, ending_point, group_size,
           price, original_price, images, description, highlights,
           inclusions, exclusions, itinerary,
           departure_rule, featured, status, badge,
           faqs, best_season, tags
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', '[]')`,
        [
          slug,
          u.title,
          u.tagline,
          u.category,
          u.region,
          u.durationDays,
          u.nights,
          u.difficulty,
          u.startingPoint,
          u.endingPoint,
          u.groupSize,
          u.price,
          u.originalPrice,
          JSON.stringify(u.images),
          u.description,
          JSON.stringify(u.highlights),
          JSON.stringify(u.inclusions),
          JSON.stringify(u.exclusions),
          JSON.stringify(u.itinerary),
          JSON.stringify(u.departureRule),
          u.featured ? 1 : 0,
          u.status,
          u.badge,
        ],
      );
      await recordAudit(
        actor,
        { action: "package.create", entityType: "package", entityId: slug, after: { id: result.insertId, slug, ...u } },
        conn,
      );
    });
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") return false;
    throw e;
  }
}

/** Returns false when no package has this slug. */
export async function setPackageStatus(slug: string, status: PackageStatus, actor: Actor) {
  return withTransaction(async (conn) => {
    const row = await lockPackage(conn, slug);
    if (!row) return false;
    if (row.status === status) return true;
    await conn.execute("UPDATE packages SET status = ? WHERE id = ?", [status, row.id]);
    await recordAudit(
      actor,
      { action: "package.status", entityType: "package", entityId: slug, before: { status: row.status }, after: { status } },
      conn,
    );
    return true;
  });
}

/** Returns false when no package has this slug. */
export async function setPackageFeatured(slug: string, featured: boolean, actor: Actor) {
  return withTransaction(async (conn) => {
    const row = await lockPackage(conn, slug);
    if (!row) return false;
    if (Boolean(row.featured) === featured) return true;
    await conn.execute("UPDATE packages SET featured = ? WHERE id = ?", [featured ? 1 : 0, row.id]);
    await recordAudit(
      actor,
      {
        action: "package.featured",
        entityType: "package",
        entityId: slug,
        before: { featured: Boolean(row.featured) },
        after: { featured },
      },
      conn,
    );
    return true;
  });
}

/** Returns false when no package has this slug. */
export async function updatePackage(slug: string, u: PackageUpdate, actor: Actor) {
  return withTransaction(async (conn) => {
    const row = await lockPackage(conn, slug);
    if (!row) return false;
    const changes = diff({ ...editableFields(row) }, { ...u });
    if (!changes.changed) return true;
    await conn.execute(
      `UPDATE packages SET
         title = ?, tagline = ?, category = ?, region = ?, duration_days = ?, nights = ?,
         difficulty = ?, starting_point = ?, ending_point = ?, group_size = ?,
         price = ?, original_price = ?, images = ?, description = ?, highlights = ?,
         inclusions = ?, exclusions = ?, itinerary = ?,
         departure_rule = ?, featured = ?, status = ?, badge = ?
       WHERE id = ?`,
      [
        u.title,
        u.tagline,
        u.category,
        u.region,
        u.durationDays,
        u.nights,
        u.difficulty,
        u.startingPoint,
        u.endingPoint,
        u.groupSize,
        u.price,
        u.originalPrice,
        JSON.stringify(u.images),
        u.description,
        JSON.stringify(u.highlights),
        JSON.stringify(u.inclusions),
        JSON.stringify(u.exclusions),
        JSON.stringify(u.itinerary),
        JSON.stringify(u.departureRule),
        u.featured ? 1 : 0,
        u.status,
        u.badge,
        row.id,
      ],
    );
    await recordAudit(
      actor,
      { action: "package.update", entityType: "package", entityId: slug, before: changes.before, after: changes.after },
      conn,
    );
    return true;
  });
}
