import "server-only";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { recordAudit, type Actor } from "./audit";
import { getBookingIdByAccessToken } from "./bookings";
import { db, withTransaction } from "./db";
import {
  RAZORPAY_ID,
  RazorpayApiError,
  capturePayment,
  createOrder,
  fetchOrderPayments,
  fetchPayment,
  razorpayKeyId,
  verifyCheckoutSignature,
  type RazorpayPayment,
} from "./razorpay";

// Every path that learns about a Razorpay payment (the checkout callback, a webhook, or a
// reconciliation call to Razorpay's API) ends in recordCapturedPayment, which is safe to
// run any number of times for the same payment.

const EFFECTIVE_STATUS =
  "CASE WHEN b.status = 'pending_payment' AND b.expires_at <= UTC_TIMESTAMP() THEN 'expired' ELSE b.status END";

type Source = "checkout" | "webhook" | "reconcile";

const actorFor = (source: Source, ip: string | null): Actor => ({
  type: "system",
  id: null,
  label: source === "checkout" ? "razorpay checkout" : source === "webhook" ? "razorpay webhook" : "razorpay reconcile",
  ip,
});

interface PaymentRow extends RowDataPacket {
  id: number;
  booking_id: number;
  status: "created" | "captured" | "failed";
  amount_paise: number | string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  signature_verified: number;
}

interface LockedBooking extends RowDataPacket {
  id: number;
  reference: string;
  status: string;
  effective_status: string;
  total_paise: number | string;
  amount_due_now_paise: number | string;
  amount_paid_paise: number | string;
}

async function lockBookingById(conn: PoolConnection, id: number) {
  const [rows] = await conn.execute<LockedBooking[]>(
    `SELECT b.id, b.reference, b.status, ${EFFECTIVE_STATUS} AS effective_status, b.total_paise,
            b.amount_due_now_paise, b.amount_paid_paise
       FROM bookings b WHERE b.id = ? FOR UPDATE`,
    [id],
  );
  return rows[0];
}

/** Rewrites the booking's cached amount paid and payment status from the ledger. */
async function refreshPaidAmount(conn: PoolConnection, booking: LockedBooking) {
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT COALESCE(SUM(CASE WHEN kind = 'payment' THEN amount_paise ELSE -amount_paise END), 0) AS paid
       FROM payments WHERE booking_id = ? AND status = 'captured'`,
    [booking.id],
  );
  const paid = Math.max(0, Number(rows[0].paid));
  const total = Number(booking.total_paise);
  const paymentStatus = paid <= 0 ? "unpaid" : paid >= total ? "paid" : "partially_paid";
  return { paid, paymentStatus };
}

// ---------------------------------------------------------------------------------------
// Starting a payment

export type StartPaymentResult =
  | {
      ok: true;
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      reference: string;
      prefill: { name: string; email: string; contact: string };
    }
  | { ok: false; error: string };

/**
 * Returns a Razorpay order for what the booking still needs before it is confirmed: the
 * amount due now (advance or full, fixed when the booking was made) minus anything already
 * paid. An open order for the same amount is reused, so retries and double clicks never
 * create a second payable order.
 */
export async function startPayment(token: string): Promise<StartPaymentResult> {
  const bookingId = await getBookingIdByAccessToken(token);
  if (!bookingId) return { ok: false, error: "Booking not found" };

  // Catch up on payments Razorpay has but we haven't recorded before offering a new attempt.
  await reconcileBooking(bookingId, null);

  return withTransaction(async (conn): Promise<StartPaymentResult> => {
    const b = await lockBookingById(conn, bookingId);
    if (!b) return { ok: false, error: "Booking not found" };
    if (b.effective_status === "confirmed" && Number(b.amount_paid_paise) > 0) return { ok: false, error: "We've already received your payment." };
    if (b.effective_status === "expired") return { ok: false, error: "This booking's payment window has closed. Please contact us or make a new booking." };
    if (b.effective_status !== "pending_payment") return { ok: false, error: "This booking doesn't need a payment right now." };
    const due = Number(b.amount_due_now_paise) - Number(b.amount_paid_paise);
    if (due <= 0) return { ok: false, error: "This booking doesn't need a payment right now." };

    const [open] = await conn.execute<PaymentRow[]>(
      `SELECT * FROM payments WHERE booking_id = ? AND method = 'razorpay' AND kind = 'payment'
          AND status IN ('created', 'failed') AND amount_paise = ? ORDER BY id DESC LIMIT 1`,
      [b.id, due],
    );
    let orderId = open[0]?.razorpay_order_id ?? null;
    if (!orderId) {
      const order = await createOrder(due, b.reference, { booking_reference: b.reference });
      if (order.amount !== due || order.currency !== "INR") throw new Error("Razorpay order does not match the amount requested");
      orderId = order.id;
      await conn.execute(
        `INSERT INTO payments (booking_id, kind, method, status, amount_paise, currency, razorpay_order_id, created_at, updated_at)
         VALUES (?, 'payment', 'razorpay', 'created', ?, 'INR', ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
        [b.id, due, orderId],
      );
      await recordAudit(
        actorFor("checkout", null),
        { action: "payment.order_created", entityType: "booking", entityId: b.reference, after: { orderId, amountPaise: due } },
        conn,
      );
    }

    const [contact] = await conn.execute<RowDataPacket[]>(
      "SELECT full_name, email, phone FROM booking_travellers WHERE booking_id = ? AND is_primary = 1",
      [b.id],
    );
    return {
      ok: true,
      keyId: razorpayKeyId(),
      orderId,
      amount: due,
      currency: "INR",
      reference: b.reference,
      prefill: { name: contact[0]?.full_name ?? "", email: contact[0]?.email ?? "", contact: contact[0]?.phone ?? "" },
    };
  });
}

// ---------------------------------------------------------------------------------------
// Recording results

export type RecordOutcome =
  | "recorded"
  | "already_recorded"
  | "not_captured"
  | "unknown_order"
  | "order_mismatch"
  | "conflict";

/** If Razorpay holds the payment as authorized (not yet captured), capture it. */
async function ensureCaptured(payment: RazorpayPayment): Promise<RazorpayPayment> {
  if (payment.status !== "authorized") return payment;
  try {
    return await capturePayment(payment.id, payment.amount);
  } catch (e) {
    // Captured meanwhile by Razorpay's auto-capture or a parallel request.
    if (e instanceof RazorpayApiError && e.status === 400) return fetchPayment(payment.id);
    throw e;
  }
}

/**
 * Applies a captured Razorpay payment to its booking. The payment must come from Razorpay
 * itself (fetched from the API, or the entity in a signed webhook), never from the browser.
 * Idempotent: a payment already recorded is left as it is.
 */
export async function recordCapturedPayment(
  payment: RazorpayPayment,
  source: Source,
  { signatureVerified = false, ip = null }: { signatureVerified?: boolean; ip?: string | null } = {},
): Promise<RecordOutcome> {
  if (payment.status !== "captured" || payment.currency !== "INR" || !payment.order_id) return "not_captured";

  return withTransaction(async (conn): Promise<RecordOutcome> => {
    const [rows] = await conn.execute<PaymentRow[]>(
      "SELECT * FROM payments WHERE razorpay_order_id = ? FOR UPDATE",
      [payment.order_id],
    );
    const row = rows[0];
    if (!row) return "unknown_order";
    const b = await lockBookingById(conn, row.booking_id);

    if (row.status === "captured") {
      if (row.razorpay_payment_id !== payment.id) {
        // Razorpay doesn't accept a second payment on a paid order; if one ever appears it is
        // real money that needs a person, so make it visible rather than dropping it.
        await recordAudit(
          actorFor(source, ip),
          {
            action: "payment.conflict",
            entityType: "booking",
            entityId: b.reference,
            after: { razorpayOrderId: payment.order_id, razorpayPaymentId: payment.id, amountPaise: payment.amount, recordedPaymentId: row.razorpay_payment_id },
          },
          conn,
        );
        console.error("Razorpay payment conflicts with an already recorded payment", { booking: b.reference, paymentId: payment.id });
        return "conflict";
      }
      if (signatureVerified && !row.signature_verified) {
        await conn.execute("UPDATE payments SET signature_verified = 1, updated_at = UTC_TIMESTAMP() WHERE id = ?", [row.id]);
      }
      return "already_recorded";
    }

    const afterExpiry = b.effective_status === "expired";
    await conn.execute(
      `UPDATE payments SET status = 'captured', amount_paise = ?, razorpay_payment_id = ?, provider_method = ?,
              signature_verified = ?, captured_via = ?, after_expiry = ?, error_code = NULL, error_description = NULL,
              received_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP()
        WHERE id = ?`,
      [
        payment.amount,
        payment.id,
        payment.method?.slice(0, 30) ?? null,
        signatureVerified ? 1 : 0,
        source === "checkout" ? "checkout" : "webhook",
        afterExpiry ? 1 : 0,
        row.id,
      ],
    );

    const { paid, paymentStatus } = await refreshPaidAmount(conn, b);
    // No departure has a capacity limit, so a valid payment that lands after the hold
    // expired still confirms the booking. A booking an admin cancelled stays cancelled;
    // the money is recorded and shown as needing a refund.
    const confirm = b.status !== "cancelled" && b.status !== "confirmed" && b.status !== "completed" && paid >= Number(b.amount_due_now_paise);
    const nextStatus = confirm ? "confirmed" : b.status;
    await conn.execute(
      `UPDATE bookings SET amount_paid_paise = ?, payment_status = ?, status = ?,
              confirmed_at = ${confirm ? "UTC_TIMESTAMP()" : "confirmed_at"}, updated_at = UTC_TIMESTAMP()
        WHERE id = ?`,
      [paid, paymentStatus, nextStatus, b.id],
    );
    await recordAudit(
      actorFor(source, ip),
      {
        action: b.status === "cancelled" ? "payment.captured_after_cancel" : "payment.captured",
        entityType: "booking",
        entityId: b.reference,
        before: { status: b.effective_status, amountPaidPaise: Number(b.amount_paid_paise) },
        after: {
          status: nextStatus,
          paymentStatus,
          amountPaidPaise: paid,
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          amountPaise: payment.amount,
          afterExpiry,
          signatureVerified,
        },
      },
      conn,
    );
    return "recorded";
  });
}

/** Notes a failed attempt on its order. The order stays payable, so this never blocks a retry. */
export async function recordFailedPayment(payment: RazorpayPayment, source: Source, ip: string | null = null): Promise<RecordOutcome> {
  if (!payment.order_id) return "unknown_order";
  return withTransaction(async (conn): Promise<RecordOutcome> => {
    const [rows] = await conn.execute<PaymentRow[]>("SELECT * FROM payments WHERE razorpay_order_id = ? FOR UPDATE", [payment.order_id]);
    const row = rows[0];
    if (!row) return "unknown_order";
    if (row.status === "captured") return "already_recorded";
    await conn.execute(
      "UPDATE payments SET status = 'failed', error_code = ?, error_description = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?",
      [payment.error_code?.slice(0, 64) ?? null, payment.error_description?.slice(0, 500) ?? null, row.id],
    );
    const [b] = await conn.execute<RowDataPacket[]>("SELECT reference FROM bookings WHERE id = ?", [row.booking_id]);
    await recordAudit(
      actorFor(source, ip),
      {
        action: "payment.failed",
        entityType: "booking",
        entityId: b[0].reference,
        after: { razorpayOrderId: payment.order_id, razorpayPaymentId: payment.id, errorCode: payment.error_code },
      },
      conn,
    );
    return "recorded";
  });
}

/** Captures (if needed) and records every successful payment Razorpay holds for this booking's open orders. */
export async function reconcileBooking(bookingId: number, ip: string | null) {
  const [rows] = await db.execute<PaymentRow[]>(
    "SELECT razorpay_order_id FROM payments WHERE booking_id = ? AND method = 'razorpay' AND status <> 'captured' AND razorpay_order_id IS NOT NULL",
    [bookingId],
  );
  const outcomes: RecordOutcome[] = [];
  for (const { razorpay_order_id } of rows) {
    const payments = await fetchOrderPayments(razorpay_order_id!);
    for (const p of payments) {
      if (p.status !== "authorized" && p.status !== "captured") continue;
      outcomes.push(await recordCapturedPayment(await ensureCaptured(p), "reconcile", { ip }));
    }
  }
  return outcomes;
}

// ---------------------------------------------------------------------------------------
// Checkout callback

export type VerifyCheckoutResult = { ok: true; outcome: RecordOutcome } | { ok: false; error: string };

/**
 * Handles the result Razorpay Checkout hands to the browser. The signature proves the ids
 * came from Razorpay; the amount and status are then read from Razorpay's API, never from
 * the request.
 */
export async function verifyCheckoutPayment(
  token: string,
  input: { orderId: string; paymentId: string; signature: string },
  ip: string | null,
): Promise<VerifyCheckoutResult> {
  const bookingId = await getBookingIdByAccessToken(token);
  if (!bookingId) return { ok: false, error: "Booking not found" };
  if (!RAZORPAY_ID.order.test(input.orderId) || !RAZORPAY_ID.payment.test(input.paymentId)) {
    return { ok: false, error: "Payment details are not valid" };
  }
  const [rows] = await db.execute<PaymentRow[]>("SELECT booking_id FROM payments WHERE razorpay_order_id = ?", [input.orderId]);
  if (!rows[0] || rows[0].booking_id !== bookingId) return { ok: false, error: "Payment details are not valid" };
  if (!verifyCheckoutSignature(input.orderId, input.paymentId, input.signature)) {
    const [b] = await db.execute<RowDataPacket[]>("SELECT reference FROM bookings WHERE id = ?", [bookingId]);
    await recordAudit(actorFor("checkout", ip), {
      action: "payment.signature_invalid",
      entityType: "booking",
      entityId: b[0].reference,
      after: { razorpayOrderId: input.orderId, razorpayPaymentId: input.paymentId },
    });
    return { ok: false, error: "We couldn't verify this payment. If money was taken, it will be matched automatically; otherwise please try again." };
  }

  const payment = await ensureCaptured(await fetchPayment(input.paymentId));
  if (payment.order_id !== input.orderId) return { ok: false, error: "Payment details are not valid" };
  if (payment.status === "failed") {
    await recordFailedPayment(payment, "checkout", ip);
    return { ok: false, error: payment.error_description ?? "The payment failed. You can try again." };
  }
  const outcome = await recordCapturedPayment(payment, "checkout", { signatureVerified: true, ip });
  return { ok: true, outcome };
}

// ---------------------------------------------------------------------------------------
// Webhooks

async function isOurOrder(orderId: string | null | undefined) {
  if (!orderId) return false;
  const [rows] = await db.execute<RowDataPacket[]>("SELECT 1 FROM payments WHERE razorpay_order_id = ?", [orderId]);
  return rows.length > 0;
}

interface WebhookPayload {
  event?: string;
  payload?: { payment?: { entity?: RazorpayPayment } };
}

/**
 * Processes a webhook whose signature has already been verified. Each Razorpay event id is
 * applied once: a redelivery of a processed event is acknowledged and skipped, while an
 * event whose earlier processing failed is retried.
 */
export async function handleWebhookEvent(eventId: string, rawBody: string, ip: string | null) {
  const body = JSON.parse(rawBody) as WebhookPayload;
  const type = String(body.event ?? "").slice(0, 64);
  const entity = body.payload?.payment?.entity;

  let eventRowId: number;
  try {
    const [res] = await db.execute<ResultSetHeader>(
      `INSERT INTO payment_webhook_events (provider_event_id, event_type, razorpay_order_id, razorpay_payment_id, payload, received_at)
       VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [eventId, type, entity?.order_id ?? null, entity?.id ?? null, rawBody],
    );
    eventRowId = res.insertId;
  } catch (e) {
    if ((e as { code?: string }).code !== "ER_DUP_ENTRY") throw e;
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT id, processed_at, outcome FROM payment_webhook_events WHERE provider_event_id = ?",
      [eventId],
    );
    if (existing[0].processed_at) return { duplicate: true, outcome: existing[0].outcome as string };
    eventRowId = existing[0].id;
  }

  try {
    let outcome: string = "ignored";
    // The Razorpay account may also serve other sites: never capture or touch a payment
    // whose order this app didn't create.
    if (entity && !(await isOurOrder(entity.order_id))) {
      outcome = "unknown_order";
    } else if (entity && ["payment.authorized", "payment.captured", "order.paid"].includes(type)) {
      outcome = await recordCapturedPayment(await ensureCaptured(entity), "webhook", { ip });
    } else if (entity && type === "payment.failed") {
      outcome = await recordFailedPayment(entity, "webhook", ip);
    }
    await db.execute("UPDATE payment_webhook_events SET processed_at = UTC_TIMESTAMP(), outcome = ?, error = NULL WHERE id = ?", [outcome, eventRowId]);
    return { duplicate: false, outcome };
  } catch (e) {
    await db.execute("UPDATE payment_webhook_events SET error = ? WHERE id = ?", [String((e as Error).message).slice(0, 500), eventRowId]);
    throw e;
  }
}

// ---------------------------------------------------------------------------------------
// Reads

export interface PaymentRecord {
  id: number;
  kind: "payment" | "refund";
  method: string;
  status: "created" | "captured" | "failed";
  amount: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  providerMethod: string | null;
  signatureVerified: boolean;
  capturedVia: "checkout" | "webhook" | null;
  afterExpiry: boolean;
  errorCode: string | null;
  errorDescription: string | null;
  receivedAt: Date | null;
  createdAt: Date;
}

/** Admin only. */
export async function listPayments(bookingId: number): Promise<PaymentRecord[]> {
  const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM payments WHERE booking_id = ? ORDER BY id", [bookingId]);
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    method: r.method,
    status: r.status,
    amount: Number(r.amount_paise) / 100,
    razorpayOrderId: r.razorpay_order_id,
    razorpayPaymentId: r.razorpay_payment_id,
    providerMethod: r.provider_method,
    signatureVerified: Boolean(r.signature_verified),
    capturedVia: r.captured_via,
    afterExpiry: Boolean(r.after_expiry),
    errorCode: r.error_code,
    errorDescription: r.error_description,
    receivedAt: r.received_at,
    createdAt: r.created_at,
  }));
}
