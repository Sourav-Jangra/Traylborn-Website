"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/server/auth/session";
import { deleteCoupon, saveCoupon, setCouponActive, type DiscountResult } from "@/server/discounts";

// Server actions are reachable by direct POST, so each one checks the session itself.

const isId = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0 && v < 2 ** 31;

function done(result: DiscountResult) {
  if (result.ok) revalidatePath("/admin/coupons");
  return result;
}

/** `id` null creates a coupon. */
export async function saveCouponAction(id: unknown, input: unknown): Promise<DiscountResult> {
  const actor = await requireAdminActor();
  if (id !== null && !isId(id)) return { ok: false, error: "This coupon no longer exists" };
  return done(await saveCoupon(id, input, actor));
}

export async function setCouponActiveAction(id: unknown, active: unknown): Promise<DiscountResult> {
  const actor = await requireAdminActor();
  if (!isId(id) || typeof active !== "boolean") return { ok: false, error: "This coupon no longer exists" };
  return done(await setCouponActive(id, active, actor));
}

export async function deleteCouponAction(id: unknown): Promise<DiscountResult> {
  const actor = await requireAdminActor();
  if (!isId(id)) return { ok: false, error: "This coupon no longer exists" };
  return done(await deleteCoupon(id, actor));
}
