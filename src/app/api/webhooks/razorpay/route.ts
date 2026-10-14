import { getClientInfo } from "@/server/auth/session";
import { handleWebhookEvent } from "@/server/payments";
import { RazorpayNotConfigured, verifyWebhookSignature } from "@/server/razorpay";

const MAX_BODY = 512 * 1024;
const EVENT_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Razorpay webhook. Only deliveries signed with RAZORPAY_WEBHOOK_SECRET over the exact raw
 * body are accepted. A non-2xx response makes Razorpay retry, so we only return one when
 * processing failed and a retry could succeed.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const eventId = request.headers.get("x-razorpay-event-id") ?? "";
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return Response.json({ error: "payload too large" }, { status: 413 });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return Response.json({ error: "payload too large" }, { status: 413 });

  let valid: boolean;
  try {
    valid = verifyWebhookSignature(raw, signature);
  } catch (e) {
    if (e instanceof RazorpayNotConfigured) return Response.json({ error: "not configured" }, { status: 503 });
    throw e;
  }
  if (!valid) return Response.json({ error: "invalid signature" }, { status: 400 });
  if (!EVENT_ID.test(eventId)) return Response.json({ error: "missing event id" }, { status: 400 });

  const { ip } = await getClientInfo();
  try {
    const result = await handleWebhookEvent(eventId, raw, ip);
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error("Razorpay webhook processing failed", { eventId, error: (e as Error).message });
    return Response.json({ error: "processing failed" }, { status: 500 });
  }
}
