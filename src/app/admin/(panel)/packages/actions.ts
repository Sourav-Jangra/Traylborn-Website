"use server";

import { revalidatePath } from "next/cache";
import type { EditablePackage } from "@/components/admin/package-editor";
import type { AdvancePayment, DepartureRule, ItineraryDay, PackageImage, PackageStatus, PriceOption } from "@/lib/types";
import { formatPrice } from "@/lib/utils/format";
import { startingPrice } from "@/lib/utils/pricing";
import { requireAdminActor } from "@/server/auth/session";
import {
  createPackage,
  setPackageFeatured,
  setPackageStatus,
  updatePackage,
  type PackageUpdate,
} from "@/server/packages";

export type SaveResult = { ok: true } | { ok: false; error: string };
export type SavePackageResult = { ok: true; priceOptions: PriceOption[] } | { ok: false; error: string };
export type CreateResult = { ok: true; slug: string } | { ok: false; error: string };

const CATEGORIES = ["treks", "road-trips", "retreats"] as const;
const STATUSES = ["published", "draft", "archived"] as const;
const DIFFICULTIES = ["Easy", "Moderate", "Challenging"] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PRICE = 10_000_000;
const MAX_PRICE_OPTIONS = 20;

class InvalidInput extends Error {}

function text(value: unknown, field: string, max: number, required = false) {
  if (typeof value !== "string") throw new InvalidInput(`${field} is missing`);
  const v = value.trim();
  if (required && !v) throw new InvalidInput(`${field} is required`);
  if (v.length > max) throw new InvalidInput(`${field} must be ${max} characters or fewer`);
  return v;
}

function int(value: unknown, field: string, min: number, max: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new InvalidInput(`${field} must be a whole number between ${min} and ${max}`);
  }
  return value;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], field: string): T {
  if (!options.includes(value as T)) throw new InvalidInput(`${field} is not valid`);
  return value as T;
}

function list<T>(value: unknown, field: string, item: (v: unknown, i: number) => T): T[] {
  if (!Array.isArray(value)) throw new InvalidInput(`${field} must be a list`);
  return value.map(item);
}

function dates(value: unknown, field: string) {
  return list(value ?? [], field, (d) => {
    if (typeof d !== "string" || !ISO_DATE.test(d)) throw new InvalidInput(`${field} contains an invalid date`);
    return d;
  });
}

function departureRule(value: unknown): DepartureRule {
  const r = (value ?? {}) as Record<string, unknown>;
  const range = () => {
    const startDate = dates([r.startDate], "Start date")[0];
    const endDate = dates([r.endDate], "End date")[0];
    if (endDate < startDate) throw new InvalidInput("Departure end date must be after the start date");
    return { startDate, endDate };
  };
  switch (r.type) {
    case "daily":
      return { type: "daily", ...range(), blackoutDates: dates(r.blackoutDates, "Blackout dates") };
    case "weekly": {
      const weekdays = list(r.weekdays, "Weekdays", (d) => int(d, "Weekday", 0, 6));
      if (!weekdays.length) throw new InvalidInput("Pick at least one departure weekday");
      return { type: "weekly", weekdays, ...range() };
    }
    case "fixed":
      return { type: "fixed", dates: dates(r.dates, "Departure dates") };
    default:
      throw new InvalidInput("Departure rule is not valid");
  }
}

function priceOptions(value: unknown): PriceOption[] {
  const options = list(value, "Price options", (o, i) => {
    const r = (o ?? {}) as Record<string, unknown>;
    const name = `Price option ${i + 1}`;
    return {
      ...(r.id == null ? {} : { id: int(r.id, `${name} id`, 1, 2 ** 31) }),
      label: text(r.label, `${name} name`, 80, true),
      price: int(r.price, `${name} price`, 1, MAX_PRICE),
      isDefault: r.isDefault === true,
    };
  });
  if (!options.length) throw new InvalidInput("Add at least one price option");
  if (options.length > MAX_PRICE_OPTIONS) throw new InvalidInput(`Use at most ${MAX_PRICE_OPTIONS} price options`);
  const labels = new Set<string>();
  for (const o of options) {
    const key = o.label.toLowerCase();
    if (labels.has(key)) throw new InvalidInput(`Two price options are both named "${o.label}"`);
    labels.add(key);
  }
  if (options.filter((o) => o.isDefault).length !== 1) throw new InvalidInput("Choose exactly one default price option");
  return options;
}

function advancePayment(value: unknown, options: PriceOption[]): AdvancePayment {
  const r = (value ?? {}) as Record<string, unknown>;
  const enabled = r.enabled === true;
  const type = oneOf(r.type, ["percent", "fixed"] as const, "Advance type");
  if (!enabled) return { enabled, type, value: int(r.value ?? 0, "Advance amount", 0, MAX_PRICE) };
  if (type === "percent") return { enabled, type, value: int(r.value, "Advance percentage", 1, 99) };
  const amount = int(r.value, "Advance amount per traveller", 1, MAX_PRICE);
  const lowest = startingPrice(options);
  if (amount >= lowest) {
    throw new InvalidInput(`Advance per traveller must be less than the lowest price option (${formatPrice(lowest)})`);
  }
  return { enabled, type, value: amount };
}

function parse(input: EditablePackage): PackageUpdate {
  const durationDays = int(input.durationDays, "Days", 1, 60);
  const options = priceOptions(input.priceOptions);
  const fromPrice = startingPrice(options);
  const originalPrice = input.originalPrice == null ? null : int(input.originalPrice, "Original price", 0, MAX_PRICE);
  if (originalPrice !== null && originalPrice <= fromPrice) {
    throw new InvalidInput("Original price must be higher than the lowest price option, or left empty");
  }
  return {
    title: text(input.title, "Title", 200, true),
    tagline: text(input.tagline, "Tagline", 300),
    category: oneOf(input.category, CATEGORIES, "Experience"),
    region: text(input.region, "Region", 120),
    durationDays,
    nights: int(input.nights, "Nights", 0, durationDays),
    difficulty: oneOf(input.difficulty, DIFFICULTIES, "Difficulty"),
    startingPoint: text(input.startingPoint, "Starting point", 120, true),
    endingPoint: text(input.endingPoint, "Ending point", 120, true),
    groupSize: text(input.groupSize, "Group size", 60),
    priceOptions: options,
    advancePayment: advancePayment(input.advancePayment, options),
    originalPrice,
    images: list<PackageImage>(input.images, "Images", (img) => {
      const i = (img ?? {}) as Record<string, unknown>;
      return { src: text(i.src, "Image path", 500, true), alt: text(i.alt ?? "", "Image alt text", 300) };
    }),
    description: text(input.description, "Description", 10_000),
    highlights: list(input.highlights, "Highlights", (h) => text(h, "Highlight", 300)).filter(Boolean),
    inclusions: list(input.inclusions, "Inclusions", (h) => text(h, "Inclusion", 300)).filter(Boolean),
    exclusions: list(input.exclusions, "Exclusions", (h) => text(h, "Exclusion", 300)).filter(Boolean),
    itinerary: list<ItineraryDay>(input.itinerary, "Itinerary", (day, i) => {
      const d = (day ?? {}) as Record<string, unknown>;
      const optional = (v: unknown, field: string) => (v ? text(v, field, 120) || undefined : undefined);
      return {
        day: i + 1,
        title: text(d.title, `Day ${i + 1} title`, 200),
        description: text(d.description, `Day ${i + 1} description`, 5_000),
        altitude: optional(d.altitude, "Altitude"),
        distance: optional(d.distance, "Distance"),
        stay: optional(d.stay, "Stay"),
        meals: optional(d.meals, "Meals"),
      };
    }),
    departureRule: departureRule(input.departureRule),
    featured: input.featured === true,
    status: oneOf(input.status, STATUSES, "Status"),
    badge: text(input.badge ?? "", "Badge", 40) || null,
  };
}

// Server actions are reachable by direct POST, so each one checks the session itself.

export async function savePackage(slug: string, input: EditablePackage): Promise<SavePackageResult> {
  const actor = await requireAdminActor();
  let update: PackageUpdate;
  try {
    update = parse(input);
  } catch (e) {
    if (e instanceof InvalidInput) return { ok: false, error: e.message };
    throw e;
  }
  if (update.images.length === 0) return { ok: false, error: "Add at least one image" };

  const saved = await updatePackage(String(slug), update, actor);
  if (!saved) return { ok: false, error: "This package no longer exists" };

  // Package data appears on the homepage, listings, detail pages and the footer.
  revalidatePath("/", "layout");
  return { ok: true, priceOptions: saved };
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requireContent(u: PackageUpdate) {
  const missing = (
    [
      ["Region", u.region],
      ["Tagline", u.tagline],
      ["Description", u.description],
      ["Group size", u.groupSize],
    ] as const
  ).find(([, v]) => !v);
  if (missing) throw new InvalidInput(`${missing[0]} is required`);
  if (!u.highlights.length) throw new InvalidInput("Add at least one highlight");
  if (!u.inclusions.length) throw new InvalidInput("Add at least one inclusion");
  if (!u.exclusions.length) throw new InvalidInput("Add at least one exclusion");
  if (!u.itinerary.length) throw new InvalidInput("Add at least one itinerary day");
  const day = u.itinerary.find((d) => !d.title || !d.description);
  if (day) throw new InvalidInput(`Day ${day.day} needs a title and description`);
  if (!u.images.length) throw new InvalidInput("Add at least one image");
}

export async function createPackageAction(input: EditablePackage): Promise<CreateResult> {
  const actor = await requireAdminActor();
  let slug: string;
  let data: PackageUpdate;
  try {
    slug = text(input.slug, "URL slug", 160, true);
    if (!SLUG.test(slug) || slug === "new") {
      throw new InvalidInput("URL slug can only use lowercase letters, numbers and single hyphens");
    }
    data = parse(input);
    requireContent(data);
  } catch (e) {
    if (e instanceof InvalidInput) return { ok: false, error: e.message };
    throw e;
  }

  const created = await createPackage(slug, data, actor);
  if (!created) return { ok: false, error: "A package with this URL slug already exists" };

  revalidatePath("/", "layout");
  return { ok: true, slug };
}

export async function updatePackageStatus(slug: string, status: PackageStatus): Promise<SaveResult> {
  const actor = await requireAdminActor();
  if (!STATUSES.includes(status)) return { ok: false, error: "Status is not valid" };
  const found = await setPackageStatus(String(slug), status, actor);
  if (!found) return { ok: false, error: "This package no longer exists" };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updatePackageFeatured(slug: string, featured: boolean): Promise<SaveResult> {
  const actor = await requireAdminActor();
  const found = await setPackageFeatured(String(slug), featured === true, actor);
  if (!found) return { ok: false, error: "This package no longer exists" };
  revalidatePath("/", "layout");
  return { ok: true };
}
