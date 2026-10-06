"use client";

import { useState } from "react";
import { CreditCard, Landmark, Loader2, Lock, Smartphone, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const methods = [
  { id: "upi", label: "UPI", Icon: Smartphone, hint: "GPay, PhonePe, Paytm" },
  { id: "card", label: "Card", Icon: CreditCard, hint: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Netbanking", Icon: Landmark, hint: "All major banks" },
  { id: "wallet", label: "Wallet", Icon: Wallet, hint: "Paytm, Amazon Pay" },
] as const;

type Method = (typeof methods)[number]["id"];

/**
 * Visual stand-in for the Razorpay checkout. In production this step
 * opens Razorpay and confirms the booking via webhook.
 */
export function PaymentStep({ amount, processing, onPay }: { amount: number; processing: boolean; onPay: () => void }) {
  const [method, setMethod] = useState<Method>("upi");

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-4 bg-pine-950 px-5 py-4 text-white sm:px-6">
        <div>
          <p className="text-xs text-white/60">Amount payable</p>
          <p className="font-display text-2xl font-semibold">{formatPrice(amount)}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
          <Lock className="size-3.5" aria-hidden="true" /> Payment preview
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[13rem_1fr]">
        <div role="tablist" aria-label="Payment method" className="scrollbar-none flex gap-2 overflow-x-auto border-b border-border p-3 sm:flex-col sm:border-r sm:border-b-0">
          {methods.map(({ id, label, Icon, hint }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={method === id}
              onClick={() => setMethod(id)}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                method === id ? "bg-pine-50 text-pine-800" : "text-ink/70 hover:bg-sand-50",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div role="tabpanel" className="p-5 sm:p-6">
          {method === "upi" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {["GPay", "PhonePe", "Paytm"].map((app) => (
                  <button key={app} type="button" className="h-14 rounded-xl border border-border text-sm font-semibold hover:border-pine-600">{app}</button>
                ))}
              </div>
              <DemoInput label="Or enter UPI ID" placeholder="yourname@okaxis" />
            </div>
          )}
          {method === "card" && (
            <div className="grid grid-cols-2 gap-3">
              <DemoInput label="Card number" placeholder="4111 1111 1111 1111" className="col-span-2" />
              <DemoInput label="Expiry" placeholder="MM / YY" />
              <DemoInput label="CVV" placeholder="•••" />
              <DemoInput label="Name on card" placeholder="Aanya Sharma" className="col-span-2" />
            </div>
          )}
          {method === "netbanking" && (
            <div className="grid grid-cols-2 gap-2">
              {["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak", "Other banks"].map((b) => (
                <button key={b} type="button" className="h-12 rounded-xl border border-border text-sm font-medium hover:border-pine-600">{b}</button>
              ))}
            </div>
          )}
          {method === "wallet" && (
            <div className="grid grid-cols-2 gap-2">
              {["Paytm", "Amazon Pay", "Mobikwik", "Freecharge"].map((w) => (
                <button key={w} type="button" className="h-12 rounded-xl border border-border text-sm font-medium hover:border-pine-600">{w}</button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onPay}
            disabled={processing}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ember-500 font-semibold text-ink transition-colors hover:bg-ember-400 disabled:opacity-80"
          >
            {processing ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Processing payment…
              </>
            ) : (
              <>
                <Lock className="size-4" /> Pay {formatPrice(amount)}
              </>
            )}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Prototype — no real payment is taken. Razorpay will be connected in the production build.
          </p>
        </div>
      </div>
    </div>
  );
}

function DemoInput({ label, placeholder, className }: { label: string; placeholder: string; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input placeholder={placeholder} className="h-12 w-full rounded-xl border border-border px-4 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10" />
    </label>
  );
}
