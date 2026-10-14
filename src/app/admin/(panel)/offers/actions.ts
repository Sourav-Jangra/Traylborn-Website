"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/server/auth/session";
import { deleteOffer, saveOffer, setOfferActive, type DiscountResult } from "@/server/discounts";

// Server actions are reachable by direct POST, so each one checks the session itself.

const isId = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0 && v < 2 ** 31;

// Offers change public prices and the homepage banner.
function done(result: DiscountResult) {
  if (result.ok) {
    revalidatePath("/admin/offers");
    revalidatePath("/", "layout");
  }
  return result;
}

/** `id` null creates an offer. */
export async function saveOfferAction(id: unknown, input: unknown): Promise<DiscountResult> {
  const actor = await requireAdminActor();
  if (id !== null && !isId(id)) return { ok: false, error: "This offer no longer exists" };
  return done(await saveOffer(id, input, actor));
}

export async function setOfferActiveAction(id: unknown, active: unknown): Promise<DiscountResult> {
  const actor = await requireAdminActor();
  if (!isId(id) || typeof active !== "boolean") return { ok: false, error: "This offer no longer exists" };
  return done(await setOfferActive(id, active, actor));
}

export async function deleteOfferAction(id: unknown): Promise<DiscountResult> {
  const actor = await requireAdminActor();
  if (!isId(id)) return { ok: false, error: "This offer no longer exists" };
  return done(await deleteOffer(id, actor));
}
