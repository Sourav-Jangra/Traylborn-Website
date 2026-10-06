"use client";

import { Pencil } from "lucide-react";
import type { PriceBreakdown } from "@/lib/utils/pricing";
import { addDays, formatDateLong, formatPrice } from "@/lib/utils/format";
import type { CheckoutPackage, TravellerDetails } from "./types";
import { cn } from "@/lib/utils";

interface ReviewStepProps {
  pkg: CheckoutPackage;
  date: string;
  details: TravellerDetails;
  breakdown: PriceBreakdown;
  agreed: boolean;
  onAgree: (v: boolean) => void;
  agreeError: boolean;
  onEdit: (step: number) => void;
}

export function ReviewStep({ pkg, date, details, breakdown, agreed, onAgree, agreeError, onEdit }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <ReviewBlock title="Your trip" onEdit={() => onEdit(0)}>
        <p className="font-semibold text-ink">{pkg.title}</p>
        <p className="text-muted-foreground">
          {formatDateLong(date)} → {formatDateLong(addDays(date, pkg.durationDays - 1))}
        </p>
        <p className="text-muted-foreground">
          {breakdown.participants} {breakdown.participants === 1 ? "traveller" : "travellers"} · {pkg.startingPoint} to {pkg.endingPoint}
        </p>
      </ReviewBlock>

      <ReviewBlock title="Lead traveller" onEdit={() => onEdit(1)}>
        <p className="font-semibold text-ink">{details.name}</p>
        <p className="text-muted-foreground">{details.email} · {details.phone}</p>
        <p className="text-muted-foreground">{details.city}</p>
        {details.companions.filter(Boolean).length > 0 && (
          <p className="mt-1 text-muted-foreground">With {details.companions.filter(Boolean).join(", ")}</p>
        )}
      </ReviewBlock>

      <ReviewBlock title="Price" onEdit={() => onEdit(0)}>
        <p className="text-muted-foreground">
          {formatPrice(breakdown.basePrice)} × {breakdown.participants} {breakdown.participants === 1 ? "traveller" : "travellers"}
        </p>
        <p className="font-display text-xl font-semibold text-ink">{formatPrice(breakdown.total)}</p>
      </ReviewBlock>

      <label className={cn("flex items-start gap-3 text-sm", agreeError && "text-destructive")}>
        <input type="checkbox" checked={agreed} onChange={(e) => onAgree(e.target.checked)} className="mt-0.5 size-4 accent-pine-800" aria-invalid={agreeError} />
        <span>
          I agree to Traylborn&apos;s terms and confirm all travellers are medically fit for this journey.
        </span>
      </label>
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-sm ring-1 ring-black/5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-sans text-xs font-semibold tracking-wider text-pine-600 uppercase">{title}</h3>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold text-pine-800 hover:underline">
          <Pencil className="size-3" /> Edit
        </button>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
