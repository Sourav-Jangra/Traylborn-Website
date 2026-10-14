// Validation for coupon codes and for the coupon/offer forms in the admin. Pure functions so
// the server and the unit tests share them; the server still checks the package exists.
import { MAX_PERCENT_DISCOUNT } from "./pricing";
import { parseISODate, toISODate } from "./format";

export const MAX_FIXED_DISCOUNT = 10_000_000;
const CODE = /^[A-Z0-9][A-Z0-9-]{2,31}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The one way a coupon code is compared and stored: spaces removed, upper case, 3–32
 * letters, digits or hyphens. Returns null for anything else.
 */
export function normalizeCouponCode(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 64) return null;
  const code = raw.replace(/\s+/g, "").toUpperCase();
  return CODE.test(code) ? code : null;
}

export class InvalidDiscount extends Error {}

export interface CouponInput {
  code: string;
  description: string;
  type: "percent" | "fixed";
  value: number;
  packageId: number | null;
  startsOn: string | null;
  endsOn: string | null;
  isActive: boolean;
}

export interface OfferInput {
  title: string;
  description: string;
  type: "percent" | "fixed";
  value: number;
  packageId: number | null;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
  showOnHomepage: boolean;
}

function record(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new InvalidDiscount("The form data isn't valid. Reload the page and try again.");
  return raw as Record<string, unknown>;
}

function text(value: unknown, label: string, max: number, required = false) {
  if (value != null && typeof value !== "string") throw new InvalidDiscount(`${label} isn't valid`);
  const v = (value ?? "").trim().replace(/\s+/g, " ");
  if (required && !v) throw new InvalidDiscount(`${label} is required`);
  if (v.length > max) throw new InvalidDiscount(`${label} must be ${max} characters or fewer`);
  return v;
}

function date(value: unknown, label: string, required: boolean) {
  if (value == null || value === "") {
    if (required) throw new InvalidDiscount(`${label} is required`);
    return null;
  }
  if (typeof value !== "string" || !ISO_DATE.test(value) || toISODate(parseISODate(value)) !== value) {
    throw new InvalidDiscount(`${label} isn't a valid date`);
  }
  return value;
}

function amount(rawType: unknown, rawValue: unknown) {
  if (rawType !== "percent" && rawType !== "fixed") throw new InvalidDiscount("Choose a percentage or a fixed amount");
  const value = typeof rawValue === "string" && rawValue.trim() !== "" ? Number(rawValue) : rawValue;
  if (typeof value !== "number" || !Number.isInteger(value)) throw new InvalidDiscount("Discount must be a whole number");
  if (rawType === "percent" && (value < 1 || value > MAX_PERCENT_DISCOUNT)) {
    throw new InvalidDiscount(`A percentage discount must be between 1 and ${MAX_PERCENT_DISCOUNT}`);
  }
  if (rawType === "fixed" && (value < 1 || value > MAX_FIXED_DISCOUNT)) {
    throw new InvalidDiscount(`A fixed discount must be between ₹1 and ₹${MAX_FIXED_DISCOUNT.toLocaleString("en-IN")}`);
  }
  return { type: rawType, value } as const;
}

function packageId(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value >= 2 ** 31) throw new InvalidDiscount("Package isn't valid");
  return value;
}

function dateRange(startsOn: string | null, endsOn: string | null) {
  if (startsOn && endsOn && endsOn < startsOn) throw new InvalidDiscount("The end date can't be before the start date");
}

export function parseCouponInput(raw: unknown): CouponInput {
  const r = record(raw);
  const code = normalizeCouponCode(r.code);
  if (!code) throw new InvalidDiscount("Code must be 3–32 letters, numbers or hyphens (for example TREK10)");
  const startsOn = date(r.startsOn, "Start date", false);
  const endsOn = date(r.endsOn, "End date", false);
  dateRange(startsOn, endsOn);
  if (typeof r.isActive !== "boolean") throw new InvalidDiscount("Active must be on or off");
  return {
    code,
    description: text(r.description, "Note", 200),
    ...amount(r.type, r.value),
    packageId: packageId(r.packageId),
    startsOn,
    endsOn,
    isActive: r.isActive,
  };
}

export function parseOfferInput(raw: unknown): OfferInput {
  const r = record(raw);
  const startsOn = date(r.startsOn, "Start date", true)!;
  const endsOn = date(r.endsOn, "End date", true)!;
  dateRange(startsOn, endsOn);
  if (typeof r.isActive !== "boolean" || typeof r.showOnHomepage !== "boolean") throw new InvalidDiscount("Switches must be on or off");
  return {
    title: text(r.title, "Title", 120, true),
    description: text(r.description, "Description", 300),
    ...amount(r.type, r.value),
    packageId: packageId(r.packageId),
    startsOn,
    endsOn,
    isActive: r.isActive,
    showOnHomepage: r.showOnHomepage,
  };
}