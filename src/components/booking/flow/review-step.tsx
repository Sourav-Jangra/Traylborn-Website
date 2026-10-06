"use client";

import { Info, Loader2, Pencil } from "lucide-react";
import type { PaymentPlan, PriceQuote } from "@/lib/utils/pricing";
import { addDays, formatDateLong, formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { CheckoutPackage, TravellerDetails } from "./types";

interface ReviewStepProps {
  pkg: CheckoutPackage;
  date: string;
  details: TravellerDetails;
  quote: PriceQuote;
  onPlanChange: (plan: PaymentPlan) => void;
  onEdit: (step: number) => void;
  onConfirm: () => void;
  pending: boolean;
  error: string | null;
}

export function ConfirmButton({ onClick, pending, className }: { onClick: () => void; pending: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-ember-500 font-semibold text-ink transition-colors hover:bg-ember-400 disabled:cursor-wait disabled:opacity-70",
        className,
      )}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {pending ? "Confirming…" : "Confirm booking"}
    </button>
  );
}

export function ReviewStep({ pkg, date, details, quote, onPlanChange, onEdit, onConfirm, pending, error }: ReviewStepProps) {
  const showOption = pkg.pricing.priceOptions.length > 1;
  return (
    <div className="space-y-6">
      <ReviewBlock title="Your trip" onEdit={() => onEdit(0)}>
        <p className="font-semibold text-ink">{pkg.title}</p>
        <p className="text-muted-foreground">
          {formatDateLong(date)} → {formatDateLong(addDays(date, pkg.durationDays - 1))}
        </p>
        {showOption && <p className="text-muted-foreground">{quote.option.label}</p>}
        <p className="text-muted-foreground">
          {quote.travellers} {quote.travellers === 1 ? "traveller" : "travellers"} · {pkg.startingPoint} to {pkg.endingPoint}
        </p>
      </ReviewBlock>

      <ReviewBlock title="Travellers" onEdit={() => onEdit(1)}>
        <p className="font-semibold text-ink">{details.name.trim()}, {details.age.trim()}</p>
        <p className="text-muted-foreground">{details.email.trim()} · {details.phone.trim()}</p>
        <p className="text-muted-foreground">{details.city.trim()}</p>
        <p className="text-muted-foreground">Emergency contact: {details.emergencyName.trim()}, {details.emergencyPhone.trim()}</p>
        {details.companions.length > 0 && (
          <ul className="mt-2 space-y-0.5 border-t border-border pt-2 text-muted-foreground">
            {details.companions.map((c, i) => (
              <li key={i}>{c.name.trim()}, {c.age.trim()}</li>
            ))}
          </ul>
        )}
      </ReviewBlock>

      <ReviewBlock title="Price" onEdit={() => onEdit(0)}>
        <p className="text-muted-foreground">
          {formatPrice(quote.option.price)} × {quote.travellers} {quote.travellers === 1 ? "traveller" : "travellers"}
        </p>
        <p className="font-display text-xl font-semibold text-ink">{formatPrice(quote.total)}</p>
      </ReviewBlock>

      {quote.advance !== null && (
        <fieldset className="rounded-2xl bg-white p-5 text-sm ring-1 ring-black/5">
          <legend className="sr-only">How would you like to pay?</legend>
          <p aria-hidden="true" className="mb-3 font-sans text-xs font-semibold tracking-wider text-pine-600 uppercase">How would you like to pay?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <PlanOption
              checked={quote.plan === "full"}
              onSelect={() => onPlanChange("full")}
              title="Full payment"
              amount={formatPrice(quote.total)}
              note="Pay the whole amount"
            />
            <PlanOption
              checked={quote.plan === "advance"}
              onSelect={() => onPlanChange("advance")}
              title="Advance payment"
              amount={formatPrice(quote.advance)}
              note={`Balance of ${formatPrice(quote.total - quote.advance)} later`}
            />
          </div>
        </fieldset>
      )}

      <div className="rounded-2xl bg-pine-50 p-5 text-sm ring-1 ring-pine-200">
        <p className="flex items-center gap-2 font-semibold text-pine-800">
          <Info className="size-4 shrink-0" aria-hidden="true" /> Nothing is charged now
        </p>
        <p className="mt-1.5 text-pine-800/80">
          Confirming creates your booking with a reference number, awaiting payment. Online payment isn&apos;t
          available yet, so our team will contact you to arrange it.
        </p>
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-destructive/8 px-4 py-3 font-medium text-destructive">
            {error}
          </p>
        )}
        <ConfirmButton onClick={onConfirm} pending={pending} className="mt-4 hidden h-12 px-8 lg:inline-flex" />
      </div>
    </div>
  );
}

function PlanOption({ checked, onSelect, title, amount, note }: { checked: boolean; onSelect: () => void; title: string; amount: string; note: string }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors",
        checked ? "border-pine-700 ring-2 ring-pine-700/15" : "border-border hover:border-pine-300",
      )}
    >
      <input type="radio" name="payment-plan" checked={checked} onChange={onSelect} className="mt-0.5 size-4 accent-pine-700" />
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block font-display text-lg font-semibold text-ink">{amount}</span>
        <span className="block text-xs text-muted-foreground">{note}</span>
      </span>
    </label>
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
