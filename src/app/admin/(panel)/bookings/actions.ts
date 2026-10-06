"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/server/auth/session";
import { cancelBooking, isValidReference, setBookingAdminNotes, type BookingUpdateResult } from "@/server/bookings";

const MAX_REASON = 500;
const MAX_NOTES = 5000;

// Server actions are reachable by direct POST, so each one checks the session itself.

export async function cancelBookingAction(reference: unknown, reason: unknown): Promise<BookingUpdateResult> {
  const actor = await requireAdminActor();
  if (!isValidReference(reference)) return { ok: false, error: "Booking not found" };
  const r = typeof reason === "string" ? reason.trim() : "";
  if (!r) return { ok: false, error: "Give a reason for cancelling" };
  if (r.length > MAX_REASON) return { ok: false, error: `Reason must be ${MAX_REASON} characters or fewer` };
  const result = await cancelBooking(reference, r, actor);
  if (result.ok) revalidatePath("/admin/bookings", "layout");
  return result;
}

export async function saveBookingNotesAction(reference: unknown, notes: unknown): Promise<BookingUpdateResult> {
  const actor = await requireAdminActor();
  if (!isValidReference(reference)) return { ok: false, error: "Booking not found" };
  if (typeof notes !== "string") return { ok: false, error: "Notes are not valid" };
  const n = notes.trim();
  if (n.length > MAX_NOTES) return { ok: false, error: `Notes must be ${MAX_NOTES} characters or fewer` };
  const result = await setBookingAdminNotes(reference, n || null, actor);
  if (result.ok) revalidatePath("/admin/bookings", "layout");
  return result;
}
