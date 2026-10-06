"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useBooking } from "./booking-context";
import { DateSelector } from "./date-selector";
import { ParticipantSelector } from "./participant-selector";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { calculatePrice } from "@/lib/utils/pricing";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { whatsappLink } from "@/lib/config/site";
import { cn } from "@/lib/utils";

interface BookingPanelProps {
  onBook?: () => void;
  /** Background of the pinned footer so it blends with its container. */
  footerClassName?: string;
  showHeader?: boolean;
}

/**
 * Date + traveller selection with a live total. The footer (total + Book Now)
 * is sticky so the CTA stays visible however tall the calendar gets.
 */
export function BookingPanel({ onBook, footerClassName = "bg-white", showHeader = true }: BookingPanelProps) {
  const { pkg, departures, date, setDate, participants, setParticipants, bookHref } = useBooking();
  const breakdown = calculatePrice(pkg.price, participants);
  const discount = pkg.originalPrice ? Math.round((1 - pkg.price / pkg.originalPrice) * 100) : 0;

  return (
    <>
      <div className="space-y-6 p-5 sm:p-6">
        {showHeader && (
          <div>
            <p className="text-sm text-muted-foreground">
              Starting from
              {discount > 0 && (
                <>
                  <span className="ml-2 line-through">{formatPrice(pkg.originalPrice!)}</span>
                  <span className="ml-2 rounded-full bg-moss-500/15 px-2 py-0.5 text-xs font-semibold text-moss-600">{discount}% off</span>
                </>
              )}
            </p>
            <p className="font-display text-3xl font-semibold text-ink">
              {formatPrice(pkg.price)}
              <span className="ml-1 font-sans text-base font-normal text-muted-foreground">/person</span>
            </p>
          </div>
        )}

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">1. Choose a departure</p>
          <DateSelector
            compact
            departures={departures}
            value={date}
            onChange={setDate}
            durationDays={pkg.durationDays}
            ruleLabel={pkg.departureLabel}
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">2. How many travellers?</p>
          <ParticipantSelector value={participants} onChange={setParticipants} />
        </div>

        <a
          href={whatsappLink(`Hi Traylborn! I have a question about ${pkg.title}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-white text-sm font-semibold text-ink transition-colors hover:border-[#25D366] hover:text-[#128C7E]"
        >
          <WhatsappIcon className="size-4 text-[#25D366]" /> Ask a question on WhatsApp
        </a>
      </div>

      <div className={cn("sticky bottom-0 space-y-3 border-t border-border p-5 sm:px-6", footerClassName)}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {formatPrice(pkg.price)} × {participants} · {date ? formatDate(date, { year: undefined }) : "No date selected"}
            </p>
            <p className="text-sm font-semibold text-ink">Total</p>
          </div>
          <p className="font-display text-2xl font-semibold text-ink">{formatPrice(breakdown.total)}</p>
        </div>
        {date ? (
          <Link
            href={bookHref}
            onClick={onBook}
            className="group flex h-13 w-full items-center justify-center gap-2 rounded-full bg-ember-500 font-semibold text-ink transition-colors hover:bg-ember-400"
          >
            Book Now
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        ) : (
          <button type="button" disabled className="flex h-13 w-full items-center justify-center rounded-full bg-ink/10 font-semibold text-ink/50">
            Select a date to continue
          </button>
        )}
      </div>
    </>
  );
}
