"use server";

import { parseDetails, type DetailErrors } from "@/lib/utils/booking-details";
import { getClientInfo } from "@/server/auth/session";
import { createBooking, isValidIdempotencyKey } from "@/server/bookings";

export type CreateBookingActionResult =
  | { ok: true; path: string }
  | { ok: false; error: string; fieldErrors?: DetailErrors; reference?: string };

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
    case "price_changed":
      return { ok: false, error: "The price for this trip has changed. Please reload the page to see the latest price." };
    case "rate_limited":
      return { ok: false, error: "Too many bookings from your connection. Please try again later or contact us." };
    case "invalid":
      return { ok: false, error: "Something went wrong with this booking. Please reload the page and try again." };
  }
}
