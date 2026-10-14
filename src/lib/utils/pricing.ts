// The only place package prices, discounts and payment amounts are calculated. The package
// page, checkout and admin preview run it in the browser for live totals; server code (and
// future payment code) must call it with pricing loaded from the database and never
// trust amounts sent by the client.
import type { AdvancePayment, PriceOption } from "@/lib/types";
import { MAX_PARTICIPANTS } from "./departures";

export type PaymentPlan = "full" | "advance";

/** A live offer or a validated coupon, as loaded from the database. */
export interface Discount {
  source: "offer" | "coupon";
  id: number;
  /** Coupon code (upper case); null for offers. */
  code: string | null;
  /** Shown to the customer, e.g. "Monsoon sale" or "Coupon TREK10". */
  label: string;
  type: "percent" | "fixed";
  /** percent 1–99, or rupees off the whole booking */
  value: number;
}

export interface PackagePricing {
  priceOptions: PriceOption[];
  advancePayment: AdvancePayment;
  /** Offers live today that apply to this package. */
  offers?: Discount[];
}

export interface PriceQuote {
  option: PriceOption;
  travellers: number;
  /** option price × travellers, before any discount */
  subtotal: number;
  /** Rupees taken off the subtotal; 0 when nothing applies. */
  discount: number;
  /** The offer or coupon behind `discount`, or null. */
  appliedDiscount: Discount | null;
  /** subtotal − discount: what the customer pays in total */
  total: number;
  /** Amount due as an advance, or null when advance payment isn't offered for this quote. */
  advance: number | null;
  plan: PaymentPlan;
  payNow: number;
  balance: number;
}

/** A booking always costs at least this much (the smallest amount Razorpay can charge). */
export const MIN_PAYABLE = 1;
export const MAX_PERCENT_DISCOUNT = 99;

export class PricingError extends Error {}

/** The lowest option price: the "starting from" price on listings and cards. */
export function startingPrice(options: PriceOption[]) {
  if (!options.length) throw new PricingError("Package has no price options");
  return Math.min(...options.map((o) => o.price));
}

export function defaultOption(options: PriceOption[]) {
  const option = options.find((o) => o.isDefault) ?? options[0];
  if (!option) throw new PricingError("Package has no price options");
  return option;
}

/**
 * Advance due for `travellers` on `option`, or null when advance payment is off or would
 * not be less than the amount payable.
 * - percent: the percentage of the total (after any discount), rounded to the nearest rupee
 * - fixed:   the fixed amount per traveller
 */
export function advanceAmount(advance: AdvancePayment, option: PriceOption, travellers: number, total = option.price * travellers): number | null {
  if (!advance.enabled) return null;
  const amount =
    advance.type === "percent" ? Math.round((total * advance.value) / 100) : advance.value * travellers;
  return amount > 0 && amount < total ? amount : null;
}

/**
 * Rupees a discount takes off `subtotal`: percent rounded to the nearest rupee, fixed as
 * given, never leaving less than MIN_PAYABLE to pay. Malformed discounts are worth 0.
 */
export function discountAmount(discount: Discount, subtotal: number) {
  const valid =
    Number.isInteger(discount.value) &&
    discount.value > 0 &&
    (discount.type === "fixed" || (discount.type === "percent" && discount.value <= MAX_PERCENT_DISCOUNT));
  if (!valid) return 0;
  const raw = discount.type === "percent" ? Math.round((subtotal * discount.value) / 100) : discount.value;
  return Math.max(0, Math.min(raw, subtotal - MIN_PAYABLE));
}

/** The single discount a booking gets: whichever of the offers and the coupon saves the most (offers win ties). */
export function bestDiscount(candidates: Discount[], subtotal: number) {
  let best: { discount: Discount; amount: number } | null = null;
  for (const d of candidates) {
    const amount = discountAmount(d, subtotal);
    if (amount > 0 && (!best || amount > best.amount)) best = { discount: d, amount };
  }
  return best;
}

export function quotePrice(
  pricing: PackagePricing,
  { optionId, travellers, plan = "full", coupon = null }: { optionId?: number | null; travellers: number; plan?: PaymentPlan; coupon?: Discount | null },
): PriceQuote {
  if (!Number.isInteger(travellers) || travellers < 1 || travellers > MAX_PARTICIPANTS) {
    throw new PricingError(`Travellers must be between 1 and ${MAX_PARTICIPANTS}`);
  }
  let option = defaultOption(pricing.priceOptions);
  if (optionId != null) {
    const found = pricing.priceOptions.find((o) => o.id === optionId);
    if (!found) throw new PricingError("Price option not found");
    option = found;
  }
  const subtotal = option.price * travellers;
  const best = bestDiscount([...(pricing.offers ?? []), ...(coupon ? [coupon] : [])], subtotal);
  const discount = best?.amount ?? 0;
  const total = subtotal - discount;
  const advance = advanceAmount(pricing.advancePayment, option, travellers, total);
  if (plan === "advance" && advance === null) throw new PricingError("Advance payment isn't available");
  const payNow = plan === "advance" ? advance! : total;
  return {
    option,
    travellers,
    subtotal,
    discount,
    appliedDiscount: best?.discount ?? null,
    total,
    advance,
    plan,
    payNow,
    balance: total - payNow,
  };
}

/** Short customer-facing description of a discount, e.g. "10% off" or "₹1,000 off". */
export function describeDiscount(discount: Pick<Discount, "type" | "value">) {
  return discount.type === "percent" ? `${discount.value}% off` : `₹${discount.value.toLocaleString("en-IN")} off`;
}

/** Short customer-facing description of the advance rule, e.g. "25% of the total". */
export function describeAdvance(advance: AdvancePayment) {
  if (!advance.enabled || advance.value < 1 || (advance.type === "percent" && advance.value > 99)) return null;
  return advance.type === "percent" ? `${advance.value}% of the total` : `₹${advance.value.toLocaleString("en-IN")} per traveller`;
}
