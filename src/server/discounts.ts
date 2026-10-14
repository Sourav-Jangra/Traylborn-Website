import "server-only";
import { connection } from "next/server";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { InvalidDiscount, parseCouponInput, parseOfferInput, type CouponInput, type OfferInput } from "@/lib/utils/discounts";
import { todayISO } from "@/lib/utils/format";
import type { Discount } from "@/lib/utils/pricing";
import { diff, recordAudit, type Actor } from "./audit";
import { db, withTransaction } from "./db";

type Conn = PoolConnection | typeof db;

/** Failed coupon checks allowed per IP per hour, at checkout and when booking. */
const MAX_FAILED_COUPON_CHECKS_PER_HOUR = 20;

// ---------------------------------------------------------------------------------------
// Live offers and coupon lookup (checkout and booking)

export interface Offer {
  id: number;
  title: string;
  description: string;
  type: Discount["type"];
  value: number;
  packageId: number | null;
  packageSlug: string | null;
  packageTitle: string | null;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
  showOnHomepage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OFFER_COLUMNS = `o.id, o.title, o.description, o.discount_type, o.discount_value, o.package_id, p.slug AS package_slug,
  p.title AS package_title, o.starts_on, o.ends_on, o.is_active, o.show_on_homepage, o.created_at, o.updated_at`;

const toOffer = (r: RowDataPacket): Offer => ({
  id: r.id,
  title: r.title,
  description: r.description,
  type: r.discount_type,
  value: r.discount_value,
  packageId: r.package_id,
  packageSlug: r.package_slug ?? null,
  packageTitle: r.package_title ?? null,
  startsOn: r.starts_on,
  endsOn: r.ends_on,
  isActive: Boolean(r.is_active),
  showOnHomepage: Boolean(r.show_on_homepage),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const offerDiscount = (o: Pick<Offer, "id" | "title" | "type" | "value">): Discount => ({
  source: "offer",
  id: o.id,
  code: null,
  label: o.title,
  type: o.type,
  value: o.value,
});

/** Offers that are switched on and running today (India time). */
export async function getLiveOffers(conn: Conn = db, { lock = false } = {}): Promise<Offer[]> {
  const today = todayISO();
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT ${OFFER_COLUMNS} FROM offers o LEFT JOIN packages p ON p.id = o.package_id
      WHERE o.is_active = 1 AND o.starts_on <= ? AND o.ends_on >= ? ORDER BY o.ends_on, o.id${lock ? " LOCK IN SHARE MODE" : ""}`,
    [today, today],
  );
  return rows.map(toOffer);
}

/** The live offers that apply to one package, ready for quotePrice. */
export function offersForPackage(offers: Offer[], packageId: number): Discount[] {
  return offers.filter((o) => o.packageId === null || o.packageId === packageId).map(offerDiscount);
}

export type CouponProblem = "unknown" | "not_started" | "expired" | "wrong_package" | "rate_limited";

export const couponProblemMessage: Record<CouponProblem, string> = {
  unknown: "That coupon code isn't valid.",
  not_started: "That coupon isn't active yet.",
  expired: "That coupon has expired.",
  wrong_package: "That coupon can't be used for this trip.",
  rate_limited: "Too many coupon attempts. Please try again in an hour.",
};

export type CouponLookup = { ok: true; discount: Discount } | { ok: false; problem: CouponProblem };

async function tooManyFailures(conn: Conn, ip: string | null) {
  if (!ip) return false;
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS n FROM coupon_checks WHERE ip = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR",
    [ip],
  );
  return Number(rows[0].n) >= MAX_FAILED_COUPON_CHECKS_PER_HOUR;
}

/**
 * Checks `code` (already normalized) for one package and returns it as a discount. Inactive
 * coupons look the same as unknown ones. Failures are counted per IP; with `lock` the
 * coupon row is share-locked so an admin edit waits for the booking that uses it.
 */
export async function lookupCoupon(
  conn: Conn,
  code: string,
  packageId: number,
  ip: string | null,
  { lock = false } = {},
): Promise<CouponLookup> {
  if (await tooManyFailures(conn, ip)) return { ok: false, problem: "rate_limited" };
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, code, discount_type, discount_value, package_id, starts_on, ends_on, is_active
       FROM coupons WHERE code = ?${lock ? " LOCK IN SHARE MODE" : ""}`,
    [code],
  );
  const c = rows[0];
  const today = todayISO();
  let problem: CouponProblem | null = null;
  if (!c || !c.is_active) problem = "unknown";
  else if (c.starts_on && today < c.starts_on) problem = "not_started";
  else if (c.ends_on && today > c.ends_on) problem = "expired";
  else if (c.package_id !== null && c.package_id !== packageId) problem = "wrong_package";
  if (problem) {
    if (ip) await conn.execute("INSERT INTO coupon_checks (ip, created_at) VALUES (?, UTC_TIMESTAMP())", [ip]);
    return { ok: false, problem };
  }
  return {
    ok: true,
    discount: { source: "coupon", id: c.id, code: c.code, label: `Coupon ${c.code}`, type: c.discount_type, value: c.discount_value },
  };
}

// ---------------------------------------------------------------------------------------
// Admin: coupons

export interface Coupon {
  id: number;
  code: string;
  description: string;
  type: Discount["type"];
  value: number;
  packageId: number | null;
  packageTitle: string | null;
  startsOn: string | null;
  endsOn: string | null;
  isActive: boolean;
  /** Bookings that used this coupon. */
  timesUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DiscountResult = { ok: true; id: number } | { ok: false; error: string };

export async function listCoupons(): Promise<Coupon[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT c.*, p.title AS package_title, (SELECT COUNT(*) FROM bookings b WHERE b.coupon_id = c.id) AS times_used
       FROM coupons c LEFT JOIN packages p ON p.id = c.package_id ORDER BY c.is_active DESC, c.created_at DESC, c.id DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    description: r.description,
    type: r.discount_type,
    value: r.discount_value,
    packageId: r.package_id,
    packageTitle: r.package_title ?? null,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
    isActive: Boolean(r.is_active),
    timesUsed: Number(r.times_used),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/** Coupon status in words, for the admin list. */
export function couponStatus(c: Pick<Coupon, "isActive" | "startsOn" | "endsOn">, today = todayISO()) {
  if (!c.isActive) return "inactive" as const;
  if (c.startsOn && today < c.startsOn) return "scheduled" as const;
  if (c.endsOn && today > c.endsOn) return "expired" as const;
  return "live" as const;
}

async function packageExists(conn: Conn, id: number | null) {
  if (id === null) return true;
  const [rows] = await conn.query<RowDataPacket[]>("SELECT 1 FROM packages WHERE id = ?", [id]);
  return rows.length > 0;
}

const couponSnapshot = (c: CouponInput) => ({
  code: c.code,
  description: c.description,
  type: c.type,
  value: c.value,
  packageId: c.packageId,
  startsOn: c.startsOn,
  endsOn: c.endsOn,
  isActive: c.isActive,
});

const couponRowSnapshot = (r: RowDataPacket) => ({
  code: r.code,
  description: r.description,
  type: r.discount_type,
  value: r.discount_value,
  packageId: r.package_id,
  startsOn: r.starts_on,
  endsOn: r.ends_on,
  isActive: Boolean(r.is_active),
});

function parse<T>(fn: (raw: unknown) => T, raw: unknown): T | string {
  try {
    return fn(raw);
  } catch (e) {
    if (e instanceof InvalidDiscount) return e.message;
    throw e;
  }
}

const isDuplicate = (e: unknown) => (e as { code?: string }).code === "ER_DUP_ENTRY";

export async function saveCoupon(id: number | null, raw: unknown, actor: Actor): Promise<DiscountResult> {
  const input = parse(parseCouponInput, raw);
  if (typeof input === "string") return { ok: false, error: input };
  try {
    return await withTransaction(async (conn): Promise<DiscountResult> => {
      if (!(await packageExists(conn, input.packageId))) return { ok: false, error: "That package no longer exists" };
      const values = [input.code, input.description, input.type, input.value, input.packageId, input.startsOn, input.endsOn, input.isActive ? 1 : 0];
      if (id === null) {
        const [result] = await conn.execute<ResultSetHeader>(
          `INSERT INTO coupons (code, description, discount_type, discount_value, package_id, starts_on, ends_on, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
          values,
        );
        await recordAudit(actor, { action: "coupon.create", entityType: "coupon", entityId: String(result.insertId), after: couponSnapshot(input) }, conn);
        return { ok: true, id: result.insertId };
      }
      const [rows] = await conn.query<RowDataPacket[]>("SELECT * FROM coupons WHERE id = ? FOR UPDATE", [id]);
      if (!rows[0]) return { ok: false, error: "This coupon no longer exists" };
      const changes = diff(couponRowSnapshot(rows[0]), couponSnapshot(input));
      if (!changes.changed) return { ok: true, id };
      await conn.execute(
        `UPDATE coupons SET code = ?, description = ?, discount_type = ?, discount_value = ?, package_id = ?, starts_on = ?, ends_on = ?,
                is_active = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?`,
        [...values, id],
      );
      await recordAudit(actor, { action: "coupon.update", entityType: "coupon", entityId: String(id), before: changes.before, after: changes.after }, conn);
      return { ok: true, id };
    });
  } catch (e) {
    if (isDuplicate(e)) return { ok: false, error: `A coupon with the code ${input.code} already exists` };
    throw e;
  }
}

export async function setCouponActive(id: number, active: boolean, actor: Actor): Promise<DiscountResult> {
  return withTransaction(async (conn): Promise<DiscountResult> => {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT is_active FROM coupons WHERE id = ? FOR UPDATE", [id]);
    if (!rows[0]) return { ok: false, error: "This coupon no longer exists" };
    if (Boolean(rows[0].is_active) === active) return { ok: true, id };
    await conn.execute("UPDATE coupons SET is_active = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [active ? 1 : 0, id]);
    await recordAudit(actor, { action: "coupon.visibility", entityType: "coupon", entityId: String(id), before: { isActive: !active }, after: { isActive: active } }, conn);
    return { ok: true, id };
  });
}

/** Bookings keep their copy of the code and discount; only the link to this row is cleared. */
export async function deleteCoupon(id: number, actor: Actor): Promise<DiscountResult> {
  return withTransaction(async (conn): Promise<DiscountResult> => {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT * FROM coupons WHERE id = ? FOR UPDATE", [id]);
    if (!rows[0]) return { ok: false, error: "This coupon no longer exists" };
    await conn.execute("DELETE FROM coupons WHERE id = ?", [id]);
    await recordAudit(actor, { action: "coupon.delete", entityType: "coupon", entityId: String(id), before: couponRowSnapshot(rows[0]) }, conn);
    return { ok: true, id };
  });
}

// ---------------------------------------------------------------------------------------
// Admin: offers

export async function listOffers(): Promise<(Offer & { timesUsed: number })[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT ${OFFER_COLUMNS}, (SELECT COUNT(*) FROM bookings b WHERE b.offer_id = o.id) AS times_used
       FROM offers o LEFT JOIN packages p ON p.id = o.package_id ORDER BY o.ends_on DESC, o.id DESC`,
  );
  return rows.map((r) => ({ ...toOffer(r), timesUsed: Number(r.times_used) }));
}

export function offerStatus(o: Pick<Offer, "isActive" | "startsOn" | "endsOn">, today = todayISO()) {
  if (!o.isActive) return "inactive" as const;
  if (today < o.startsOn) return "scheduled" as const;
  if (today > o.endsOn) return "ended" as const;
  return "live" as const;
}

const offerSnapshot = (o: OfferInput) => ({
  title: o.title,
  description: o.description,
  type: o.type,
  value: o.value,
  packageId: o.packageId,
  startsOn: o.startsOn,
  endsOn: o.endsOn,
  isActive: o.isActive,
  showOnHomepage: o.showOnHomepage,
});

const offerRowSnapshot = (r: RowDataPacket) => ({
  title: r.title,
  description: r.description,
  type: r.discount_type,
  value: r.discount_value,
  packageId: r.package_id,
  startsOn: r.starts_on,
  endsOn: r.ends_on,
  isActive: Boolean(r.is_active),
  showOnHomepage: Boolean(r.show_on_homepage),
});

export async function saveOffer(id: number | null, raw: unknown, actor: Actor): Promise<DiscountResult> {
  const input = parse(parseOfferInput, raw);
  if (typeof input === "string") return { ok: false, error: input };
  return withTransaction(async (conn): Promise<DiscountResult> => {
    if (!(await packageExists(conn, input.packageId))) return { ok: false, error: "That package no longer exists" };
    const values = [input.title, input.description, input.type, input.value, input.packageId, input.startsOn, input.endsOn, input.isActive ? 1 : 0, input.showOnHomepage ? 1 : 0];
    if (id === null) {
      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO offers (title, description, discount_type, discount_value, package_id, starts_on, ends_on, is_active, show_on_homepage, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
        values,
      );
      await recordAudit(actor, { action: "offer.create", entityType: "offer", entityId: String(result.insertId), after: offerSnapshot(input) }, conn);
      return { ok: true, id: result.insertId };
    }
    const [rows] = await conn.query<RowDataPacket[]>("SELECT * FROM offers WHERE id = ? FOR UPDATE", [id]);
    if (!rows[0]) return { ok: false, error: "This offer no longer exists" };
    const changes = diff(offerRowSnapshot(rows[0]), offerSnapshot(input));
    if (!changes.changed) return { ok: true, id };
    await conn.execute(
      `UPDATE offers SET title = ?, description = ?, discount_type = ?, discount_value = ?, package_id = ?, starts_on = ?, ends_on = ?,
              is_active = ?, show_on_homepage = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?`,
      [...values, id],
    );
    await recordAudit(actor, { action: "offer.update", entityType: "offer", entityId: String(id), before: changes.before, after: changes.after }, conn);
    return { ok: true, id };
  });
}

export async function setOfferActive(id: number, active: boolean, actor: Actor): Promise<DiscountResult> {
  return withTransaction(async (conn): Promise<DiscountResult> => {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT is_active FROM offers WHERE id = ? FOR UPDATE", [id]);
    if (!rows[0]) return { ok: false, error: "This offer no longer exists" };
    if (Boolean(rows[0].is_active) === active) return { ok: true, id };
    await conn.execute("UPDATE offers SET is_active = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [active ? 1 : 0, id]);
    await recordAudit(actor, { action: "offer.visibility", entityType: "offer", entityId: String(id), before: { isActive: !active }, after: { isActive: active } }, conn);
    return { ok: true, id };
  });
}

export async function deleteOffer(id: number, actor: Actor): Promise<DiscountResult> {
  return withTransaction(async (conn): Promise<DiscountResult> => {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT * FROM offers WHERE id = ? FOR UPDATE", [id]);
    if (!rows[0]) return { ok: false, error: "This offer no longer exists" };
    await conn.execute("DELETE FROM offers WHERE id = ?", [id]);
    await recordAudit(actor, { action: "offer.delete", entityType: "offer", entityId: String(id), before: offerRowSnapshot(rows[0]) }, conn);
    return { ok: true, id };
  });
}

// ---------------------------------------------------------------------------------------
// Public display

/** Live offers whose package (if any) is published. */
export async function getPublicOffers(): Promise<Offer[]> {
  // Which offers are live depends on today's date, so never prerender this.
  await connection();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT ${OFFER_COLUMNS} FROM offers o LEFT JOIN packages p ON p.id = o.package_id
      WHERE o.is_active = 1 AND o.starts_on <= ? AND o.ends_on >= ?
        AND (o.package_id IS NULL OR p.status = 'published')
      ORDER BY o.ends_on, o.id`,
    [todayISO(), todayISO()],
  );
  return rows.map(toOffer);
}

export async function getHomepageOffers(): Promise<Offer[]> {
  return (await getPublicOffers()).filter((o) => o.showOnHomepage);
}
