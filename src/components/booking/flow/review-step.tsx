"use client";

import { Info, Pencil } from "lucide-react";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { whatsappLink } from "@/lib/config/site";
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
}

/** WhatsApp message carrying the reviewed trip and traveller details to the Traylborn team. */
export function bookingWhatsappLink(pkg: CheckoutPackage, date: string, details: TravellerDetails, quote: PriceQuote) {
  const companions = details.companions.map((c) => c.trim()).filter(Boolean);
  const lines = [
    `Hi Traylborn! I'd like to book ${pkg.title}.`,
    `Departure: ${formatDateLong(date)}`,
    pkg.pricing.priceOptions.length > 1 ? `Option: ${quote.option.label}` : "",
    `Travellers: ${quote.travellers} (${formatPrice(quote.option.price)} per person, total ${formatPrice(quote.total)})`,
    quote.advance === null
      ? ""
      : quote.plan === "advance"
        ? `Payment: advance of ${formatPrice(quote.payNow)} now, balance ${formatPrice(quote.balance)} later`
        : `Payment: full amount (${formatPrice(quote.total)})`,
    `Lead traveller: ${details.name.trim()}, ${details.phone.trim()}, ${details.email.trim()}, ${details.city.trim()}`,
    companions.length ? `Other travellers: ${companions.join(", ")}` : "",
    details.emergencyName.trim() || details.emergencyPhone.trim()
      ? `Emergency contact: ${[details.emergencyName.trim(), details.emergencyPhone.trim()].filter(Boolean).join(", ")}`
      : "",
    details.notes.trim() ? `Notes: ${details.notes.trim()}` : "",
  ];
  return whatsappLink(lines.filter(Boolean).join("\n"));
}

export function ReviewStep({ pkg, date, details, quote, onPlanChange, onEdit }: ReviewStepProps) {
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
          <Info className="size-4 shrink-0" aria-hidden="true" /> Online booking isn&apos;t available yet
        </p>
        <p className="mt-1.5 text-pine-800/80">
          Nothing has been booked or paid. Send these details to our team on WhatsApp and we&apos;ll confirm your
          departure and how to pay.
        </p>
        <a
          href={bookingWhatsappLink(pkg, date, details, quote)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-[#25D366] px-6 font-semibold text-white transition-colors hover:bg-[#1fbb59]"
        >
          <WhatsappIcon className="size-4" /> Send details on WhatsApp
        </a>
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
