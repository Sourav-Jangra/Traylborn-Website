"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence } from "framer-motion";
import { Tag, X } from "lucide-react";
import { m } from "@/components/ui/motion";
import type { Coupon } from "@/lib/types";
import { validateCoupon } from "@/lib/utils/pricing";
import { cn } from "@/lib/utils";

interface CouponInputProps {
  participants: number;
  applied?: Coupon;
  onApply: (coupon: Coupon | undefined) => void;
  suggestions?: string[];
}

export function CouponInput({ participants, applied, onApply, suggestions = ["TRAYLBORN10", "FIRSTTRAIL"] }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apply = (value: string) => {
    const result = validateCoupon(value, participants);
    if (result.ok) {
      onApply(result.coupon);
      setError(null);
      setCode("");
    } else {
      setError(result.error);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    apply(code);
  };

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {applied ? (
          <m.div
            key="applied"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-moss-500/40 bg-moss-500/10 p-3 pl-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Tag className="size-4 shrink-0 text-moss-600" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold tracking-wider text-ink">{applied.code}</p>
                <p className="truncate text-xs text-moss-600">{applied.description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onApply(undefined)}
              aria-label={`Remove coupon ${applied.code}`}
              className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-white"
            >
              <X className="size-4" />
            </button>
          </m.div>
        ) : (
          <m.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <label htmlFor="coupon" className="sr-only">Coupon code</label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Coupon code"
                autoComplete="off"
                aria-invalid={!!error}
                aria-describedby={error ? "coupon-error" : undefined}
                className={cn(
                  "h-12 min-w-0 flex-1 rounded-xl border bg-white px-4 font-mono text-sm tracking-wider uppercase outline-none placeholder:font-sans placeholder:tracking-normal placeholder:normal-case focus:ring-4",
                  error ? "border-destructive focus:ring-destructive/10" : "border-border focus:border-pine-600 focus:ring-pine-600/10",
                )}
              />
              <button type="submit" className="h-12 shrink-0 rounded-xl bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-pine-800">
                Apply
              </button>
            </div>
            {error ? (
              <p id="coupon-error" role="alert" className="mt-2 text-xs text-destructive">{error}</p>
            ) : (
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                Try:
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => apply(s)} className="rounded-md border border-dashed border-pine-300 px-2 py-0.5 font-mono font-semibold text-pine-700 hover:bg-pine-50">
                    {s}
                  </button>
                ))}
              </p>
            )}
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}
