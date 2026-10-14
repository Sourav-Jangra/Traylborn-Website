"use server";

import { getClientInfo } from "@/server/auth/session";
import { startPayment, verifyCheckoutPayment, type StartPaymentResult } from "@/server/payments";
import { RazorpayApiError, RazorpayNotConfigured } from "@/server/razorpay";

export type VerifyPaymentActionResult = { ok: true; confirmed: boolean } | { ok: false; error: string };

const UNAVAILABLE = "Online payment is unavailable right now. Please try again in a few minutes or contact us.";

function providerError(e: unknown): string | null {
  if (e instanceof RazorpayNotConfigured || e instanceof RazorpayApiError) return UNAVAILABLE;
  if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) return UNAVAILABLE;
  return null;
}

// Public: the booking token is the only credential, and amounts always come from the database.
export async function startPaymentAction(token: unknown): Promise<StartPaymentResult> {
  if (typeof token !== "string") return { ok: false, error: "Booking not found" };
  try {
    return await startPayment(token);
  } catch (e) {
    const message = providerError(e);
    if (message) return { ok: false, error: message };
    throw e;
  }
}

export async function verifyPaymentAction(token: unknown, response: unknown): Promise<VerifyPaymentActionResult> {
  const r = (response && typeof response === "object" ? response : {}) as Record<string, unknown>;
  if (
    typeof token !== "string" ||
    typeof r.razorpay_order_id !== "string" ||
    typeof r.razorpay_payment_id !== "string" ||
    typeof r.razorpay_signature !== "string"
  ) {
    return { ok: false, error: "Payment details are not valid" };
  }
  const { ip } = await getClientInfo();
  try {
    const result = await verifyCheckoutPayment(
      token,
      { orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature },
      ip,
    );
    if (!result.ok) return result;
    return { ok: true, confirmed: result.outcome === "recorded" || result.outcome === "already_recorded" };
  } catch (e) {
    const message = providerError(e);
    if (message) return { ok: false, error: "We couldn't confirm your payment yet. If money was taken it will be matched automatically; refresh this page in a minute." };
    throw e;
  }
}
