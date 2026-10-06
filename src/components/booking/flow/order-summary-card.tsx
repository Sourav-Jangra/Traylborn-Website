import Image from "next/image";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { PriceBreakdown } from "@/lib/utils/pricing";
import { addDays, formatDate } from "@/lib/utils/format";
import { BookingSummary } from "../booking-summary";
import type { CheckoutPackage } from "./types";

interface OrderSummaryCardProps {
  pkg: CheckoutPackage;
  date: string | null;
  breakdown: PriceBreakdown;
}

export function OrderSummaryCard({ pkg, date, breakdown }: OrderSummaryCardProps) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-black/5">
      <div className="flex gap-4 border-b border-border p-5">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl">
          <Image src={pkg.image} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight font-semibold text-ink">{pkg.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{pkg.startingPoint} → {pkg.endingPoint}</span>
          </p>
          <p className="text-sm text-muted-foreground">{pkg.durationDays} days · {pkg.nights} nights</p>
        </div>
      </div>
      <div className="space-y-2.5 border-b border-border p-5 text-sm">
        <p className="flex items-center gap-2.5 text-ink">
          <CalendarDays className="size-4 text-pine-600" aria-hidden="true" />
          {date ? `${formatDate(date)} – ${formatDate(addDays(date, pkg.durationDays - 1))}` : <span className="text-muted-foreground">Select a departure date</span>}
        </p>
        <p className="flex items-center gap-2.5 text-ink">
          <Users className="size-4 text-pine-600" aria-hidden="true" />
          {breakdown.participants} {breakdown.participants === 1 ? "traveller" : "travellers"}
        </p>
      </div>
      <div className="space-y-5 p-5">
        <BookingSummary breakdown={breakdown} />
      </div>
    </div>
  );
}
