import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.razorpay.com/v1";
const TIMEOUT_MS = 15_000;

export class RazorpayNotConfigured extends Error {}
export class RazorpayApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId) || !keySecret) {
    throw new RazorpayNotConfigured("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set. See .env.example.");
  }
  return { keyId, keySecret };
}

export function isRazorpayConfigured() {
  try {
    credentials();
    return true;
  } catch {
    return false;
  }
}

/** The public key id, safe to send to the browser for Razorpay Checkout. */
export function razorpayKeyId() {
  return credentials().keyId;
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const { keyId, keySecret } = credentials();
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: { description?: string } }) | null;
  if (!res.ok || !data) {
    // Razorpay error descriptions never contain credentials.
    throw new RazorpayApiError(data?.error?.description ?? `Razorpay request failed (${res.status})`, res.status);
  }
  return data;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
}

export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string | null;
  captured: boolean;
  error_code: string | null;
  error_description: string | null;
}

export function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  return call<RazorpayOrder>("POST", "/orders", { amount: amountPaise, currency: "INR", receipt, notes });
}

export function fetchPayment(paymentId: string) {
  return call<RazorpayPayment>("GET", `/payments/${encodeURIComponent(paymentId)}`);
}

export async function fetchOrderPayments(orderId: string) {
  return (await call<{ items: RazorpayPayment[] }>("GET", `/orders/${encodeURIComponent(orderId)}/payments`)).items;
}

export function capturePayment(paymentId: string, amountPaise: number) {
  return call<RazorpayPayment>("POST", `/payments/${encodeURIComponent(paymentId)}/capture`, { amount: amountPaise, currency: "INR" });
}

function hmacMatches(secret: string, message: string, signature: string) {
  const expected = createHmac("sha256", secret).update(message).digest();
  const given = Buffer.from(signature, "hex");
  return /^[0-9a-f]{64}$/i.test(signature) && given.length === expected.length && timingSafeEqual(given, expected);
}

/** Signature Razorpay Checkout returns after a payment: HMAC-SHA256(order_id|payment_id, key secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  return hmacMatches(credentials().keySecret, `${orderId}|${paymentId}`, signature);
}

/** X-Razorpay-Signature on webhooks: HMAC-SHA256 of the raw request body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret) throw new RazorpayNotConfigured("RAZORPAY_WEBHOOK_SECRET must be set. See .env.example.");
  return hmacMatches(secret, rawBody, signature);
}

export const RAZORPAY_ID = {
  order: /^order_[A-Za-z0-9]{6,30}$/,
  payment: /^pay_[A-Za-z0-9]{6,30}$/,
};
