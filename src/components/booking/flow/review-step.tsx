"use client";

import { Info, Pencil } from "lucide-react";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { whatsappLink } from "@/lib/config/site";
import type { PriceBreakdown } from "@/lib/utils/pricing";
import { addDays, formatDateLong, formatPrice } from "@/lib/utils/format";
import type { CheckoutPackage, TravellerDetails } from "./types";

interface ReviewStepProps {
  pkg: CheckoutPackage;
  date: string;
  details: TravellerDetails;
  breakdown: PriceBreakdown;
  onEdit: (step: number) => void;
}

/** WhatsApp message carrying the reviewed trip and traveller details to the Traylborn team. */
export function bookingWhatsappLink(pkg: CheckoutPackage, date: string, details: TravellerDetails, breakdown: PriceBreakdown) {
  const companions = details.companions.map((c) => c.trim()).filter(Boolean);
  const lines = [
    `Hi Traylborn! I'd like to book ${pkg.title}.`,
    `Departure: ${formatDateLong(date)}`,
    `Travellers: ${breakdown.participants} (${formatPrice(breakdown.basePrice)} per person, total ${formatPrice(breakdown.total)})`,
    `Lead traveller: ${details.name.trim()}, ${details.phone.trim()}, ${details.email.trim()}, ${details.city.trim()}`,
    companions.length ? `Other travellers: ${companions.join(", ")}` : "",
    details.emergencyName.trim() || details.emergencyPhone.trim()
      ? `Emergency contact: ${[details.emergencyName.trim(), details.emergencyPhone.trim()].filter(Boolean).join(", ")}`
      : "",
    details.notes.trim() ? `Notes: ${details.notes.trim()}` : "",
  ];
  return whatsappLink(lines.filter(Boolean).join("\n"));
}

export function ReviewStep({ pkg, date, details, breakdown, onEdit }: ReviewStepProps) {
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

      <div className="rounded-2xl bg-pine-50 p-5 text-sm ring-1 ring-pine-200">
        <p className="flex items-center gap-2 font-semibold text-pine-800">
          <Info className="size-4 shrink-0" aria-hidden="true" /> Online booking isn&apos;t available yet
        </p>
        <p className="mt-1.5 text-pine-800/80">
          Nothing has been booked or paid. Send these details to our team on WhatsApp and we&apos;ll confirm your
          departure and how to pay.
        </p>
        <a
          href={bookingWhatsappLink(pkg, date, details, breakdown)}
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
