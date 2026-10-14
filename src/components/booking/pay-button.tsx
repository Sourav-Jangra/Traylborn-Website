"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { startPaymentAction, verifyPaymentAction } from "@/app/(checkout)/bookings/[token]/actions";
import { formatPrice } from "@/lib/utils/format";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (r: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("load failed"));
    document.body.appendChild(script);
  });
}

export function PayButton({ token, amount, label }: { token: string; amount: number; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [verifying, startVerify] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  const pay = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const [order] = await Promise.all([startPaymentAction(token), loadCheckout()]);
      if (!order.ok) {
        setMessage({ tone: "error", text: order.error });
        router.refresh();
        return;
      }
      const rzp = new window.Razorpay!({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Traylborn",
        description: `Booking ${order.reference}`,
        prefill: order.prefill,
        notes: { booking_reference: order.reference },
        theme: { color: "#1f4d3a" },
        handler: (response: RazorpayResponse) => {
          startVerify(async () => {
            const result = await verifyPaymentAction(token, response);
            setMessage(
              result.ok
                ? { tone: "info", text: result.confirmed ? "Payment received. Thank you!" : "We're confirming your payment with Razorpay…" }
                : { tone: "error", text: result.error },
            );
            router.refresh();
          });
        },
        modal: {
          ondismiss: () => setMessage((m) => m ?? { tone: "info", text: "Payment window closed. If you didn't complete a payment, you can try again." }),
        },
      });
      rzp.on("payment.failed", (r) => {
        setMessage({ tone: "error", text: `${r.error?.description ?? "The payment failed."} You can try again.` });
      });
      rzp.open();
    } catch {
      setMessage({ tone: "error", text: "Couldn't open the payment window. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  const pending = busy || verifying;
  return (
    <div>
      <button
        type="button"
        onClick={pay}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ember-500 px-8 font-semibold text-ink transition-colors hover:bg-ember-400 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
        {verifying ? "Confirming payment…" : `${label} ${formatPrice(amount)}`}
      </button>
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "mt-3 text-sm font-medium text-destructive" : "mt-3 text-sm text-pine-800"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
