"use server";

import { parseDetails, type DetailErrors } from "@/lib/utils/booking-details";
import { normalizeCouponCode } from "@/lib/utils/discounts";
import type { Discount } from "@/lib/utils/pricing";
import { getClientInfo } from "@/server/auth/session";
import { createBooking, isValidIdempotencyKey } from "@/server/bookings";
import { couponProblemMessage, lookupCoupon } from "@/server/discounts";
import { db } from "@/server/db";
import { getPackageBySlug } from "@/server/packages";

export type CreateBookingActionResult =
  | { ok: true; path: string }
  | { ok: false; error: string; fieldErrors?: DetailErrors; reference?: string; couponError?: boolean };

export type CheckCouponResult = { ok: true; coupon: Discount } | { ok: false; error: string };

// Public. The returned discount only drives the totals shown at checkout; createBooking
// looks the coupon up again and recalculates everything itself.
export async function checkCouponAction(slug: unknown, code: unknown): Promise<CheckCouponResult> {
  if (typeof slug !== "string" || slug.length > 160) return { ok: false, error: couponProblemMessage.unknown };
  const normalized = normalizeCouponCode(code);
  if (!normalized) return { ok: false, error: couponProblemMessage.unknown };
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return { ok: false, error: "This trip is no longer open for booking." };
  const { ip } = await getClientInfo();
  const result = await lookupCoupon(db, normalized, Number(pkg.id), ip);
  return result.ok ? { ok: true, coupon: result.discount } : { ok: false, error: couponProblemMessage[result.problem] };
}

const MAX_AMOUNT = 1_000_000_000;

function amount(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_AMOUNT ? value : null;
}

// Public: anyone can POST to this action, so every value is checked here or in createBooking.
export async function createBookingAction(input: unknown): Promise<CreateBookingActionResult> {
  const r = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const optionId = r.optionId;
  const expectedTotal = amount(r.expectedTotal);
  const expectedPayNow = amount(r.expectedPayNow);
  const couponCode = r.couponCode == null || r.couponCode === "" ? null : normalizeCouponCode(r.couponCode);
  if (r.couponCode != null && r.couponCode !== "" && !couponCode) {
    return { ok: false, couponError: true, error: couponProblemMessage.unknown };
  }
  if (
    typeof r.slug !== "string" ||
    r.slug.length > 160 ||
    typeof r.departureDate !== "string" ||
    typeof optionId !== "number" ||
    !Number.isInteger(optionId) ||
    (r.plan !== "full" && r.plan !== "advance") ||
    expectedTotal === null ||
    expectedPayNow === null ||
    !isValidIdempotencyKey(r.idempotencyKey)
  ) {
    return { ok: false, error: "Something went wrong with this booking. Please reload the page and try again." };
  }

  const parsed = parseDetails(r.details);
  if (!parsed.ok) {
    return { ok: false, error: "Please check the traveller details.", fieldErrors: parsed.errors };
  }

  const { ip } = await getClientInfo();
  const result = await createBooking({
    slug: r.slug,
    departureDate: r.departureDate,
    optionId,
    plan: r.plan,
    expectedTotal,
    expectedPayNow,
    couponCode,
    idempotencyKey: r.idempotencyKey,
    details: parsed.details,
    ip,
  });

  if (result.ok) return { ok: true, path: `/bookings/${result.accessToken}` };
  switch (result.reason) {
    case "duplicate":
      return {
        ok: false,
        reference: result.reference,
        error: `This booking was already submitted as ${result.reference}. If you didn't see your booking page, contact us with this reference.`,
      };
    case "unavailable":
      return { ok: false, error: "This trip is no longer open for booking." };
    case "date_unavailable":
      return { ok: false, error: "That departure date is no longer available. Please choose another date." };
    case "coupon":
      return { ok: false, couponError: true, error: `${couponProblemMessage[result.problem]} Remove it or try another code, then confirm again.` };
    case "price_changed":
      return { ok: false, error: "The price for this trip has changed. Please reload the page to see the latest price." };
    case "rate_limited":
      return { ok: false, error: "Too many bookings from your connection. Please try again later or contact us." };
    case "invalid":
      return { ok: false, error: "Something went wrong with this booking. Please reload the page and try again." };
  }
}
