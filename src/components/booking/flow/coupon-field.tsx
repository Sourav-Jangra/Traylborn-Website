"use client";

import { useState, useTransition } from "react";
import { Loader2, TicketPercent, X } from "lucide-react";
import type { Discount, PriceQuote } from "@/lib/utils/pricing";
import { formatPrice } from "@/lib/utils/format";
import { checkCouponAction } from "@/app/(checkout)/book/[slug]/actions";

interface CouponFieldProps {
  slug: string;
  coupon: Discount | null;
  quote: PriceQuote;
  onChange: (coupon: Discount | null) => void;
}

export function CouponField({ slug, coupon, quote, onChange }: CouponFieldProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const apply = () => {
    if (!code.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await checkCouponAction(slug, code);
      if (result.ok) {
        onChange(result.coupon);
        setCode("");
      } else {
        setError(result.error);
      }
    });
  };

  if (coupon) {
    const used = quote.appliedDiscount?.source === "coupon";
    return (
      <div className="rounded-2xl bg-white p-5 text-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <TicketPercent className="size-4 text-pine-600" aria-hidden="true" /> Coupon {coupon.code}
          </p>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 text-xs font-semibold text-pine-800 hover:underline"
          >
            <X className="size-3" /> Remove
          </button>
        </div>
        <p className="mt-1 text-muted-foreground">
          {used
            ? `Applied: you save ${formatPrice(quote.discount)}.`
            : quote.appliedDiscount
              ? `${quote.appliedDiscount.label} already saves you more, so this coupon isn't used.`
              : "This coupon doesn't reduce the price of this booking."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 text-sm ring-1 ring-black/5">
      <label htmlFor="coupon-code" className="font-sans text-xs font-semibold tracking-wider text-pine-600 uppercase">
        Have a coupon?
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="coupon-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          maxLength={40}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Enter code"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "coupon-error" : undefined}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-white px-3.5 uppercase outline-none placeholder:normal-case focus:border-pine-600 aria-invalid:border-destructive"
        />
        <button
          type="button"
          onClick={apply}
          disabled={pending || !code.trim()}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-pine-800 px-5 font-semibold text-white transition-colors hover:bg-pine-700 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Apply
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-2 text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
