"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useBooking } from "./booking-context";
import { BookingPanel } from "./booking-panel";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { whatsappLink } from "@/lib/config/site";

/** Sticky bottom CTA for mobile; opens the full booking panel in a bottom sheet. */
export function MobileBookingBar() {
  const { pkg, date, participants } = useBooking();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div data-mobile-booking-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="container-page flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl leading-tight font-semibold text-ink">
              {formatPrice(pkg.price)}
              <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">/person</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {date ? `${formatDate(date, { year: undefined })} · ${participants} travellers` : pkg.departureLabel}
            </p>
          </div>
          <a
            href={whatsappLink(`Hi Traylborn! I have a question about ${pkg.title}.`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Enquire on WhatsApp"
            className="grid size-12 shrink-0 place-items-center rounded-full border border-border text-[#25D366]"
          >
            <WhatsappIcon className="size-5" />
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-ember-500 px-5 font-semibold text-ink"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            {date ? "Book Now" : "Select dates"}
          </button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[92svh] gap-0 overflow-y-auto rounded-t-[1.75rem] bg-sand-50 p-0">
          <SheetHeader className="sticky top-0 z-10 border-b border-border bg-sand-50/95 px-5 pt-5 pb-4 backdrop-blur">
            <SheetTitle className="font-display text-xl">{pkg.title}</SheetTitle>
            <SheetDescription>
              {pkg.durationDays} days · {pkg.departureLabel}
            </SheetDescription>
          </SheetHeader>
          <BookingPanel onBook={() => setOpen(false)} footerClassName="bg-white pb-[max(1.25rem,env(safe-area-inset-bottom))]" showHeader={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}
