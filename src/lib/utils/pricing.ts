import type { Coupon } from "@/lib/types";
import { coupons } from "@/lib/mock-data/coupons";

export interface PriceBreakdown {
  basePrice: number;
  participants: number;
  subtotal: number;
  discount: number;
  total: number;
  coupon?: Coupon;
}

export type CouponResult =
  | { ok: true; coupon: Coupon }
  | { ok: false; error: string };

export function validateCoupon(code: string, participants: number): CouponResult {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Enter a coupon code" };
  const coupon = coupons.find((c) => c.code === normalized);
  if (!coupon || !coupon.active) return { ok: false, error: "This code isn't valid" };
  if (coupon.minParticipants && participants < coupon.minParticipants) {
    return {
      ok: false,
      error: `Valid for groups of ${coupon.minParticipants}+ travellers`,
    };
  }
  return { ok: true, coupon };
}

export function calculatePrice(
  basePrice: number,
  participants: number,
  coupon?: Coupon,
): PriceBreakdown {
  const subtotal = basePrice * participants;
  let discount = 0;
  if (coupon) {
    discount =
      coupon.type === "percent"
        ? Math.round((subtotal * coupon.value) / 100)
        : Math.min(coupon.value * participants, subtotal);
  }
  return {
    basePrice,
    participants,
    subtotal,
    discount,
    total: subtotal - discount,
    coupon,
  };
}
