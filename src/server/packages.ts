import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
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
import { db } from "./db";

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
  images: PackageImage[];
  highlights: string[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  things_to_carry: string[] | null;
  faqs: FAQ[];
  best_season: Season[];
  tags: string[];
  departure_rule: DepartureRule;
}

function toPackage(row: PackageRow): TravelPackage {
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
    bestSeason: row.best_season,
    groupSize: row.group_size,
    ageLimit: row.age_limit,
    images: row.images,
    video: row.video ?? undefined,
    description: row.description,
    highlights: row.highlights,
    itinerary: row.itinerary,
    inclusions: row.inclusions,
    exclusions: row.exclusions,
    thingsToCarry: row.things_to_carry ?? undefined,
    faqs: row.faqs,
    departureRule: row.departure_rule,
    departureLabel: describeDepartures(row.departure_rule),
    featured: Boolean(row.featured),
    status: row.status,
    tags: row.tags,
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

/** Returns false when the slug is already taken. */
export async function createPackage(slug: string, u: PackageUpdate) {
  try {
    await db.execute(
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
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") return false;
    throw e;
  }
}

/** Returns false when no package has this slug. */
export async function setPackageStatus(slug: string, status: PackageStatus) {
  const [result] = await db.execute<ResultSetHeader>("UPDATE packages SET status = ? WHERE slug = ?", [status, slug]);
  return result.affectedRows > 0;
}

/** Returns false when no package has this slug. */
export async function setPackageFeatured(slug: string, featured: boolean) {
  const [result] = await db.execute<ResultSetHeader>("UPDATE packages SET featured = ? WHERE slug = ?", [featured ? 1 : 0, slug]);
  return result.affectedRows > 0;
}

/** Returns false when no package has this slug. */
export async function updatePackage(slug: string, u: PackageUpdate) {
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE packages SET
       title = ?, tagline = ?, category = ?, region = ?, duration_days = ?, nights = ?,
       difficulty = ?, starting_point = ?, ending_point = ?, group_size = ?,
       price = ?, original_price = ?, images = ?, description = ?, highlights = ?,
       inclusions = ?, exclusions = ?, itinerary = ?,
       departure_rule = ?, featured = ?, status = ?, badge = ?
     WHERE slug = ?`,
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
      slug,
    ],
  );
  return result.affectedRows > 0;
}
