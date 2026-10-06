// The only place package prices and payment amounts are calculated. The package page,
// checkout and admin preview run it in the browser for live totals; server code (and
// future payment code) must call it with pricing loaded from the database and never
// trust amounts sent by the client.
import type { AdvancePayment, PriceOption } from "@/lib/types";
import { MAX_PARTICIPANTS } from "./departures";

export type PaymentPlan = "full" | "advance";

export interface PackagePricing {
  priceOptions: PriceOption[];
  advancePayment: AdvancePayment;
}

export interface PriceQuote {
  option: PriceOption;
  travellers: number;
  /** option price × travellers */
  total: number;
  /** Amount due as an advance, or null when advance payment isn't offered for this quote. */
  advance: number | null;
  plan: PaymentPlan;
  payNow: number;
  balance: number;
}

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
 * not be less than the full amount.
 * - percent: the percentage of the total, rounded to the nearest rupee
 * - fixed:   the fixed amount per traveller
 */
export function advanceAmount(advance: AdvancePayment, option: PriceOption, travellers: number): number | null {
  if (!advance.enabled) return null;
  const total = option.price * travellers;
  const amount =
    advance.type === "percent" ? Math.round((total * advance.value) / 100) : advance.value * travellers;
  return amount > 0 && amount < total ? amount : null;
}

export function quotePrice(
  pricing: PackagePricing,
  { optionId, travellers, plan = "full" }: { optionId?: number | null; travellers: number; plan?: PaymentPlan },
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
  const total = option.price * travellers;
  const advance = advanceAmount(pricing.advancePayment, option, travellers);
  if (plan === "advance" && advance === null) throw new PricingError("Advance payment isn't available");
  const payNow = plan === "advance" ? advance! : total;
  return { option, travellers, total, advance, plan, payNow, balance: total - payNow };
}

/** Short customer-facing description of the advance rule, e.g. "25% of the total". */
export function describeAdvance(advance: AdvancePayment) {
  if (!advance.enabled || advance.value < 1 || (advance.type === "percent" && advance.value > 99)) return null;
  return advance.type === "percent" ? `${advance.value}% of the total` : `₹${advance.value.toLocaleString("en-IN")} per traveller`;
}
