import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  AdvancePayment,
  Category,
  DepartureRule,
  Difficulty,
  FAQ,
  ItineraryDay,
  PackageImage,
  PackageStatus,
  PriceOption,
  Season,
  TravelPackage,
} from "@/lib/types";
import { describeDepartures } from "@/lib/utils/departures";
import { startingPrice } from "@/lib/utils/pricing";
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
  /** Denormalised lowest option price; written by this module, never read. */
  price: number;
  original_price: number | null;
  advance_enabled: number;
  advance_type: AdvancePayment["type"];
  advance_value: number;
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

interface PriceOptionRow extends RowDataPacket {
  id: number;
  package_id: number;
  label: string;
  price: number;
  is_default: number;
}

const OPTION_COLUMNS = "id, package_id, label, price, is_default";
const OPTION_ORDER = "ORDER BY sort_order, id";

function toPriceOption(row: PriceOptionRow): PriceOption {
  return { id: row.id, label: row.label, price: row.price, isDefault: Boolean(row.is_default) };
}

function toPackage(row: PackageRow, optionRows: PriceOptionRow[]): TravelPackage {
  const departureRule = parseJson<DepartureRule>(row.departure_rule);
  const priceOptions = optionRows.map(toPriceOption);
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
    // A package without options can't be priced; public queries leave such packages out.
    price: priceOptions.length ? startingPrice(priceOptions) : 0,
    originalPrice: row.original_price ?? undefined,
    priceOptions,
    advancePayment: {
      enabled: Boolean(row.advance_enabled),
      type: row.advance_type,
      value: row.advance_value,
    },
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
  if (!rows.length) return [];
  const [options] = await db.query<PriceOptionRow[]>(
    `SELECT ${OPTION_COLUMNS} FROM package_price_options WHERE package_id IN (?) ${OPTION_ORDER}`,
    [rows.map((r) => r.id)],
  );
  return rows.map((row) => toPackage(row, options.filter((o) => o.package_id === row.id)));
}

/** Every package regardless of status — admin only. */
export const getAllPackages = cache(() => query("SELECT * FROM packages ORDER BY featured DESC, title"));

export const getPublishedPackages = cache(async () =>
  (await query("SELECT * FROM packages WHERE status = 'published' ORDER BY featured DESC, title")).filter(
    (p) => p.priceOptions.length > 0,
  ),
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
  priceOptions: PriceOption[];
  advancePayment: AdvancePayment;
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
function editableFields(row: PackageRow, optionRows: PriceOptionRow[]): PackageUpdate {
  const p = toPackage(row, optionRows);
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
    priceOptions: p.priceOptions,
    advancePayment: p.advancePayment,
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

async function lockPriceOptions(conn: PoolConnection, packageId: number) {
  const [rows] = await conn.query<PriceOptionRow[]>(
    `SELECT ${OPTION_COLUMNS} FROM package_price_options WHERE package_id = ? ${OPTION_ORDER} FOR UPDATE`,
    [packageId],
  );
  return rows;
}

/**
 * Makes the package's stored options match `options` (in order), keeping the ids of
 * options that still exist. Ids that don't belong to this package are treated as new.
 */
async function writePriceOptions(conn: PoolConnection, packageId: number, options: PriceOption[], existing: PriceOptionRow[]) {
  const existingIds = new Set(existing.map((o) => o.id));
  const keptIds = new Set(options.flatMap((o) => (o.id !== undefined && existingIds.has(o.id) ? [o.id] : [])));
  const removed = existing.filter((o) => !keptIds.has(o.id)).map((o) => o.id);
  if (removed.length) await conn.query("DELETE FROM package_price_options WHERE id IN (?)", [removed]);
  // Park kept labels first so renames that swap labels can't collide on the unique key.
  if (keptIds.size) {
    await conn.query("UPDATE package_price_options SET label = CONCAT('#', id) WHERE id IN (?)", [[...keptIds]]);
  }
  for (const [i, o] of options.entries()) {
    if (o.id !== undefined && keptIds.has(o.id)) {
      await conn.execute(
        "UPDATE package_price_options SET label = ?, price = ?, is_default = ?, sort_order = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?",
        [o.label, o.price, o.isDefault ? 1 : 0, i, o.id],
      );
    } else {
      await conn.execute(
        `INSERT INTO package_price_options (package_id, label, price, is_default, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
        [packageId, o.label, o.price, o.isDefault ? 1 : 0, i],
      );
    }
  }
  const [rows] = await conn.query<PriceOptionRow[]>(
    `SELECT ${OPTION_COLUMNS} FROM package_price_options WHERE package_id = ? ${OPTION_ORDER}`,
    [packageId],
  );
  return rows.map(toPriceOption);
}

/** Returns false when the slug is already taken. */
export async function createPackage(slug: string, u: PackageUpdate, actor: Actor) {
  try {
    await withTransaction(async (conn) => {
      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO packages (
           slug, title, tagline, category, region, duration_days, nights,
           difficulty, starting_point, ending_point, group_size,
           price, original_price, advance_enabled, advance_type, advance_value,
           images, description, highlights, inclusions, exclusions, itinerary,
           departure_rule, featured, status, badge,
           faqs, best_season, tags
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', '[]')`,
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
          startingPrice(u.priceOptions),
          u.originalPrice,
          u.advancePayment.enabled ? 1 : 0,
          u.advancePayment.type,
          u.advancePayment.value,
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
      const priceOptions = await writePriceOptions(conn, result.insertId, u.priceOptions, []);
      await recordAudit(
        actor,
        {
          action: "package.create",
          entityType: "package",
          entityId: slug,
          after: { id: result.insertId, slug, ...u, priceOptions },
        },
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

/** Returns the saved price options (with ids), or false when no package has this slug. */
export async function updatePackage(slug: string, u: PackageUpdate, actor: Actor): Promise<PriceOption[] | false> {
  return withTransaction(async (conn) => {
    const row = await lockPackage(conn, slug);
    if (!row) return false;
    const optionRows = await lockPriceOptions(conn, row.id);
    const changes = diff({ ...editableFields(row, optionRows) }, { ...u });
    if (!changes.changed) return optionRows.map(toPriceOption);
    await conn.execute(
      `UPDATE packages SET
         title = ?, tagline = ?, category = ?, region = ?, duration_days = ?, nights = ?,
         difficulty = ?, starting_point = ?, ending_point = ?, group_size = ?,
         price = ?, original_price = ?, advance_enabled = ?, advance_type = ?, advance_value = ?,
         images = ?, description = ?, highlights = ?, inclusions = ?, exclusions = ?, itinerary = ?,
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
        startingPrice(u.priceOptions),
        u.originalPrice,
        u.advancePayment.enabled ? 1 : 0,
        u.advancePayment.type,
        u.advancePayment.value,
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
    const priceOptions = "priceOptions" in changes.after
      ? await writePriceOptions(conn, row.id, u.priceOptions, optionRows)
      : optionRows.map(toPriceOption);
    await recordAudit(
      actor,
      {
        action: "package.update",
        entityType: "package",
        entityId: slug,
        before: changes.before,
        after: "priceOptions" in changes.after ? { ...changes.after, priceOptions } : changes.after,
      },
      conn,
    );
    return priceOptions;
  });
}
