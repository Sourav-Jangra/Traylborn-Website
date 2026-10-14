import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { AdvancePayment, DepartureRule, PriceOption } from "@/lib/types";
import type { CleanDetails } from "@/lib/utils/booking-details";
import { isDateAllowed, MAX_PARTICIPANTS } from "@/lib/utils/departures";
import { addDays, parseISODate, toISODate, todayISO } from "@/lib/utils/format";
import { PricingError, quotePrice, type PaymentPlan } from "@/lib/utils/pricing";
import { recordAudit, type Actor } from "./audit";
import { db, parseJson, withTransaction } from "./db";
import { getLiveOffers, lookupCoupon, offersForPackage, type CouponProblem } from "./discounts";

export const BOOKING_STATUSES = ["pending_payment", "confirmed", "cancelled", "expired", "completed"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PaymentStatus = "unpaid" | "partially_paid" | "paid" | "refunded";

/** How long an unpaid booking holds its place before it counts as expired. */
export const HOLD_MINUTES = 30;
const MAX_BOOKINGS_PER_IP_PER_HOUR = 10;
const REFERENCE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const REFERENCE = /^TB-[2-9A-HJ-NP-Z]{6}$/;
const ACCESS_TOKEN = /^[A-Za-z0-9_-]{43}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Pending bookings past their hold are reported as expired; nothing rewrites the row. */
const EFFECTIVE_STATUS =
  "CASE WHEN b.status = 'pending_payment' AND b.expires_at <= UTC_TIMESTAMP() THEN 'expired' ELSE b.status END";

const paise = (rupees: number) => Math.round(rupees * 100);
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function newReference() {
  return `TB-${Array.from({ length: 6 }, () => REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)]).join("")}`;
}

export function isValidReference(value: unknown): value is string {
  return typeof value === "string" && REFERENCE.test(value);
}

export function isValidIdempotencyKey(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function isRealDate(value: string) {
  return ISO_DATE.test(value) && toISODate(parseISODate(value)) === value;
}

function duplicateKey(e: unknown) {
  const err = e as { code?: string; sqlMessage?: string };
  if (err.code !== "ER_DUP_ENTRY") return null;
  const msg = err.sqlMessage ?? "";
  return ["bookings_reference", "bookings_access_token", "bookings_idempotency"].find((k) => msg.includes(k)) ?? "other";
}

export interface BookingRequest {
  slug: string;
  departureDate: string;
  optionId: number;
  plan: PaymentPlan;
  /** The totals the customer was shown; a mismatch means the price changed. */
  expectedTotal: number;
  expectedPayNow: number;
  /** Normalized coupon code the customer entered, or null. */
  couponCode: string | null;
  idempotencyKey: string;
  details: CleanDetails;
  ip: string | null;
}

export type CreateBookingResult =
  | { ok: true; reference: string; accessToken: string }
  | { ok: false; reason: "unavailable" | "date_unavailable" | "invalid" | "price_changed" | "rate_limited" }
  | { ok: false; reason: "coupon"; problem: CouponProblem }
  | { ok: false; reason: "duplicate"; reference: string };

interface LockedPackage extends RowDataPacket {
  id: number;
  title: string;
  status: string;
  duration_days: number;
  advance_enabled: number;
  advance_type: AdvancePayment["type"];
  advance_value: number;
  departure_rule: string;
}

async function findByIdempotencyKey(key: string, conn: PoolConnection | typeof db = db) {
  const [rows] = await conn.execute<RowDataPacket[]>("SELECT reference FROM bookings WHERE idempotency_key = ?", [key]);
  return (rows[0]?.reference as string | undefined) ?? null;
}

/**
 * Creates a pending booking. Everything that decides what is booked and what it costs —
 * package, option, date availability, traveller count and amounts — is read or
 * recomputed here from the database; the request only says what the customer chose.
 */
export async function createBooking(req: BookingRequest): Promise<CreateBookingResult> {
  const travellerCount = req.details.travellers.length;
  if (travellerCount < 1 || travellerCount > MAX_PARTICIPANTS) return { ok: false, reason: "invalid" };
  if (!isRealDate(req.departureDate)) return { ok: false, reason: "date_unavailable" };

  const existing = await findByIdempotencyKey(req.idempotencyKey);
  if (existing) return { ok: false, reason: "duplicate", reference: existing };

  if (req.ip) {
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM bookings WHERE created_ip = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR",
      [req.ip],
    );
    if (Number(rows[0].n) >= MAX_BOOKINGS_PER_IP_PER_HOUR) return { ok: false, reason: "rate_limited" };
  }

  try {
    return await withTransaction(async (conn): Promise<CreateBookingResult> => {
      // Shared locks: an admin edit to this package or its options waits until the booking commits.
      const [pkgRows] = await conn.query<LockedPackage[]>(
        `SELECT id, title, status, duration_days, advance_enabled, advance_type, advance_value, departure_rule
           FROM packages WHERE slug = ? LOCK IN SHARE MODE`,
        [req.slug],
      );
      const pkg = pkgRows[0];
      if (!pkg || pkg.status !== "published") return { ok: false, reason: "unavailable" };
      const [optionRows] = await conn.query<RowDataPacket[]>(
        "SELECT id, label, price, is_default FROM package_price_options WHERE package_id = ? ORDER BY sort_order, id LOCK IN SHARE MODE",
        [pkg.id],
      );
      const priceOptions: PriceOption[] = optionRows.map((o) => ({
        id: o.id,
        label: o.label,
        price: o.price,
        isDefault: Boolean(o.is_default),
      }));
      if (!priceOptions.length) return { ok: false, reason: "unavailable" };

      const rule = parseJson<DepartureRule>(pkg.departure_rule);
      if (!isDateAllowed(rule, req.departureDate, todayISO())) return { ok: false, reason: "date_unavailable" };

      const advancePayment: AdvancePayment = {
        enabled: Boolean(pkg.advance_enabled),
        type: pkg.advance_type,
        value: pkg.advance_value,
      };
      // Offers and the coupon are read here, under share locks, never taken from the request.
      const offers = offersForPackage(await getLiveOffers(conn, { lock: true }), Number(pkg.id));
      let coupon = null;
      if (req.couponCode) {
        const found = await lookupCoupon(conn, req.couponCode, pkg.id, req.ip, { lock: true });
        if (!found.ok) return { ok: false, reason: "coupon", problem: found.problem };
        coupon = found.discount;
      }
      let quote;
      try {
        quote = quotePrice({ priceOptions, advancePayment, offers }, { optionId: req.optionId, travellers: travellerCount, plan: req.plan, coupon });
      } catch (e) {
        if (e instanceof PricingError) return { ok: false, reason: "price_changed" };
        throw e;
      }
      if (quote.total !== req.expectedTotal || quote.payNow !== req.expectedPayNow) return { ok: false, reason: "price_changed" };

      const accessToken = randomBytes(32).toString("base64url");
      const offersAdvance = quote.advance !== null;
      const applied = quote.appliedDiscount;
      let bookingId = 0;
      let reference = "";
      for (let attempt = 0; !bookingId; attempt++) {
        reference = newReference();
        try {
          const [result] = await conn.execute<ResultSetHeader>(
            `INSERT INTO bookings (
               reference, access_token_hash, idempotency_key, source, package_id, price_option_id,
               package_title, option_label, departure_date, end_date, traveller_count,
               unit_price_paise, subtotal_paise, discount_paise,
               discount_source, discount_label, discount_type, discount_value, coupon_id, coupon_code, offer_id, total_paise,
               payment_plan, advance_type, advance_value, amount_due_now_paise,
               status, payment_status, expires_at, customer_notes, created_ip, created_at, updated_at
             ) VALUES (?, ?, ?, 'website', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               'pending_payment', 'unpaid', UTC_TIMESTAMP() + INTERVAL ${HOLD_MINUTES} MINUTE, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
            [
              reference,
              hashToken(accessToken),
              req.idempotencyKey,
              pkg.id,
              quote.option.id!,
              pkg.title,
              quote.option.label,
              req.departureDate,
              addDays(req.departureDate, pkg.duration_days - 1),
              travellerCount,
              paise(quote.option.price),
              paise(quote.subtotal),
              paise(quote.discount),
              applied?.source ?? null,
              applied?.label ?? null,
              applied?.type ?? null,
              applied?.value ?? null,
              applied?.source === "coupon" ? applied.id : null,
              applied?.source === "coupon" ? applied.code : null,
              applied?.source === "offer" ? applied.id : null,
              paise(quote.total),
              quote.plan,
              offersAdvance ? advancePayment.type : null,
              offersAdvance ? advancePayment.value : null,
              paise(quote.payNow),
              req.details.notes,
              req.ip,
            ],
          );
          bookingId = result.insertId;
        } catch (e) {
          // A failed INSERT only rolls back that statement, so retrying inside the transaction is safe.
          if (duplicateKey(e) === "bookings_reference" && attempt < 5) continue;
          throw e;
        }
      }

      for (const [i, t] of req.details.travellers.entries()) {
        await conn.execute(
          `INSERT INTO booking_travellers (
             booking_id, position, is_primary, full_name, age, email, phone, city,
             emergency_contact_name, emergency_contact_phone, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
          [bookingId, i + 1, i === 0 ? 1 : 0, t.fullName, t.age, t.email, t.phone, t.city, t.emergencyName, t.emergencyPhone],
        );
      }

      // Personal details stay out of the audit log; the booking row holds them.
      await recordAudit(
        { type: "system", id: null, label: "website checkout", ip: req.ip },
        {
          action: "booking.create",
          entityType: "booking",
          entityId: reference,
          after: {
            package: req.slug,
            option: quote.option.label,
            departureDate: req.departureDate,
            travellers: travellerCount,
            plan: quote.plan,
            subtotal: quote.subtotal,
            discount: quote.discount,
            ...(applied && { discountSource: applied.source, discountLabel: applied.label, couponCode: applied.code, offerId: applied.source === "offer" ? applied.id : null }),
            total: quote.total,
            payNow: quote.payNow,
            status: "pending_payment",
          },
        },
        conn,
      );
      return { ok: true, reference, accessToken };
    });
  } catch (e) {
    if (duplicateKey(e) === "bookings_idempotency") {
      const reference = await findByIdempotencyKey(req.idempotencyKey);
      if (reference) return { ok: false, reason: "duplicate", reference };
    }
    throw e;
  }
}

export interface BookingTraveller {
  position: number;
  isPrimary: boolean;
  fullName: string;
  age: number;
  email: string | null;
  phone: string | null;
  city: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
}

/** Amounts are in rupees. */
export interface Booking {
  /** Internal id; server-side use only. */
  id: number;
  reference: string;
  packageSlug: string | null;
  packageTitle: string;
  optionLabel: string;
  departureDate: string;
  endDate: string;
  travellerCount: number;
  unitPrice: number;
  /** unitPrice × travellers, before any discount */
  subtotal: number;
  discount: number;
  /** What the discount was, as copied when the booking was made; null without one. */
  discountLabel: string | null;
  couponCode: string | null;
  total: number;
  paymentPlan: PaymentPlan;
  /** Advance or full amount required to confirm the booking. */
  amountDueNow: number;
  /** Captured payments minus refunds. */
  amountPaid: number;
  /** total − amountPaid */
  balance: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  expiresAt: Date | null;
  customerNotes: string | null;
  adminNotes: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  cancelledAt: Date | null;
  travellers: BookingTraveller[];
}

const BOOKING_COLUMNS = `b.id, b.reference, p.slug AS package_slug, b.package_title, b.option_label, b.departure_date, b.end_date,
  b.traveller_count, b.unit_price_paise, b.subtotal_paise, b.discount_paise, b.discount_label, b.coupon_code, b.total_paise, b.payment_plan, b.amount_due_now_paise, b.amount_paid_paise,
  ${EFFECTIVE_STATUS} AS effective_status, b.payment_status, b.expires_at, b.customer_notes, b.admin_notes,
  b.cancellation_reason, b.created_at, b.cancelled_at`;

async function loadBooking(where: string, value: string): Promise<Booking | null> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT ${BOOKING_COLUMNS} FROM bookings b LEFT JOIN packages p ON p.id = b.package_id WHERE ${where} = ?`,
    [value],
  );
  const b = rows[0];
  if (!b) return null;
  const [travellers] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM booking_travellers WHERE booking_id = ? ORDER BY position",
    [b.id],
  );
  const total = Number(b.total_paise) / 100;
  const dueNow = Number(b.amount_due_now_paise) / 100;
  const paid = Number(b.amount_paid_paise) / 100;
  return {
    id: b.id,
    reference: b.reference,
    packageSlug: b.package_slug ?? null,
    packageTitle: b.package_title,
    optionLabel: b.option_label,
    departureDate: b.departure_date,
    endDate: b.end_date,
    travellerCount: b.traveller_count,
    unitPrice: Number(b.unit_price_paise) / 100,
    subtotal: Number(b.subtotal_paise) / 100,
    discount: Number(b.discount_paise) / 100,
    discountLabel: b.discount_label ?? null,
    couponCode: b.coupon_code ?? null,
    total,
    paymentPlan: b.payment_plan,
    amountDueNow: dueNow,
    amountPaid: paid,
    balance: total - paid,
    status: b.effective_status,
    paymentStatus: b.payment_status,
    expiresAt: b.expires_at,
    customerNotes: b.customer_notes,
    adminNotes: b.admin_notes,
    cancellationReason: b.cancellation_reason,
    createdAt: b.created_at,
    cancelledAt: b.cancelled_at,
    travellers: travellers.map((t) => ({
      position: t.position,
      isPrimary: Boolean(t.is_primary),
      fullName: t.full_name,
      age: t.age,
      email: t.email,
      phone: t.phone,
      city: t.city,
      emergencyName: t.emergency_contact_name,
      emergencyPhone: t.emergency_contact_phone,
    })),
  };
}

/** The guest's view of their booking, found by the secret token in their booking link. */
export async function getBookingByAccessToken(token: string) {
  if (!ACCESS_TOKEN.test(token)) return null;
  return loadBooking("b.access_token_hash", hashToken(token));
}

export async function getBookingIdByAccessToken(token: unknown) {
  if (typeof token !== "string" || !ACCESS_TOKEN.test(token)) return null;
  const [rows] = await db.execute<RowDataPacket[]>("SELECT id FROM bookings WHERE access_token_hash = ?", [hashToken(token)]);
  return (rows[0]?.id as number | undefined) ?? null;
}

/** Admin only. */
export async function getBookingByReference(reference: string) {
  if (!isValidReference(reference)) return null;
  return loadBooking("b.reference", reference);
}

export interface BookingListRow {
  reference: string;
  packageTitle: string;
  departureDate: string;
  travellerCount: number;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  primaryName: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  createdAt: Date;
}

export const BOOKING_LIST_LIMIT = 200;

/** Admin only. Newest first; `search` matches reference, or the primary booker's name, email or phone. */
export async function listBookings({ search, status }: { search?: string; status?: BookingStatus }) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (status) {
    where.push(`${EFFECTIVE_STATUS} = ?`);
    params.push(status);
  }
  if (search) {
    const like = `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    where.push("(b.reference LIKE ? OR t.full_name LIKE ? OR t.email LIKE ? OR t.phone LIKE ?)");
    params.push(like, like, like, like);
  }
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT b.reference, b.package_title, b.departure_date, b.traveller_count, b.total_paise,
            ${EFFECTIVE_STATUS} AS effective_status, b.payment_status, b.created_at,
            t.full_name, t.email, t.phone
       FROM bookings b
       JOIN booking_travellers t ON t.booking_id = b.id AND t.is_primary = 1
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY b.created_at DESC, b.id DESC
      LIMIT ${BOOKING_LIST_LIMIT}`,
    params,
  );
  return rows.map(
    (r): BookingListRow => ({
      reference: r.reference,
      packageTitle: r.package_title,
      departureDate: r.departure_date,
      travellerCount: r.traveller_count,
      total: Number(r.total_paise) / 100,
      status: r.effective_status,
      paymentStatus: r.payment_status,
      primaryName: r.full_name,
      primaryEmail: r.email,
      primaryPhone: r.phone,
      createdAt: r.created_at,
    }),
  );
}

async function lockBooking(conn: PoolConnection, reference: string) {
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT b.id, b.status, ${EFFECTIVE_STATUS} AS effective_status, b.admin_notes FROM bookings b WHERE b.reference = ? FOR UPDATE`,
    [reference],
  );
  return rows[0];
}

export type BookingUpdateResult = { ok: true } | { ok: false; error: string };

/** Admin only. Unpaid bookings (pending or expired) and confirmed bookings can be cancelled. */
export async function cancelBooking(reference: string, reason: string, actor: Actor): Promise<BookingUpdateResult> {
  return withTransaction(async (conn) => {
    const row = await lockBooking(conn, reference);
    if (!row) return { ok: false, error: "This booking no longer exists" };
    if (!["pending_payment", "expired", "confirmed"].includes(row.effective_status)) {
      return { ok: false, error: `A ${String(row.effective_status).replace("_", " ")} booking can't be cancelled` };
    }
    await conn.execute(
      "UPDATE bookings SET status = 'cancelled', cancelled_at = UTC_TIMESTAMP(), cancellation_reason = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?",
      [reason, row.id],
    );
    await recordAudit(
      actor,
      {
        action: "booking.cancel",
        entityType: "booking",
        entityId: reference,
        before: { status: row.effective_status },
        after: { status: "cancelled", reason },
      },
      conn,
    );
    return { ok: true };
  });
}

/** Admin only. Internal notes, never shown to the customer. */
export async function setBookingAdminNotes(reference: string, notes: string | null, actor: Actor): Promise<BookingUpdateResult> {
  return withTransaction(async (conn) => {
    const row = await lockBooking(conn, reference);
    if (!row) return { ok: false, error: "This booking no longer exists" };
    if ((row.admin_notes ?? null) === notes) return { ok: true };
    await conn.execute("UPDATE bookings SET admin_notes = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?", [notes, row.id]);
    await recordAudit(
      actor,
      { action: "booking.notes", entityType: "booking", entityId: reference, before: { adminNotes: row.admin_notes }, after: { adminNotes: notes } },
      conn,
    );
    return { ok: true };
  });
}
