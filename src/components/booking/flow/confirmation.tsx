"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { m, EASE } from "@/components/ui/motion";
import { WhatsappIcon } from "@/components/brand/social-icons";
import type { PriceBreakdown } from "@/lib/utils/pricing";
import { addDays, formatDateLong, formatPrice } from "@/lib/utils/format";
import { whatsappLink } from "@/lib/mock-data/site";
import type { CheckoutPackage, TravellerDetails } from "./types";

interface ConfirmationProps {
  bookingId: string;
  pkg: CheckoutPackage;
  date: string;
  details: TravellerDetails;
  breakdown: PriceBreakdown;
}

export function Confirmation({ bookingId, pkg, date, details, breakdown }: ConfirmationProps) {
  return (
    <div className="container-page max-w-4xl py-10 sm:py-16">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="text-center"
      >
        <m.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
          className="mx-auto grid size-20 place-items-center rounded-full bg-moss-500 text-white shadow-xl shadow-moss-500/30"
        >
          <Check className="size-10" strokeWidth={3} />
        </m.span>
        <p className="eyebrow mt-6 justify-center text-moss-600">Checkout preview complete</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Thanks, {details.name.split(" ")[0] || "traveller"}!</h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          This is a preview of the booking flow. No payment was taken, and no booking, email or WhatsApp message has been sent.
        </p>
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
        className="mt-10 overflow-hidden rounded-[2rem] bg-white ring-1 ring-black/5"
      >
        <div className="relative h-40 sm:h-52">
          <Image src={pkg.image} alt="" fill sizes="(min-width: 896px) 896px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-pine-950/85 to-transparent" />
          <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4 text-white sm:inset-x-7">
            <div>
              <p className="text-xs tracking-wider text-white/70 uppercase">Preview reference</p>
              <p className="font-mono text-lg font-semibold">{bookingId}</p>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">Preview</span>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[
            { label: "Journey", value: pkg.title },
            { label: "Departure", value: formatDateLong(date) },
            { label: "Return", value: formatDateLong(addDays(date, pkg.durationDays - 1)) },
            { label: "Travellers", value: String(breakdown.participants) },
            { label: "Price per person", value: formatPrice(breakdown.basePrice) },
            { label: "Total", value: formatPrice(breakdown.total) },
            { label: "Starts", value: pkg.startingPoint },
            { label: "Ends", value: pkg.endingPoint },
          ].map((f) => (
            <div key={f.label} className="bg-white p-4 sm:p-5">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:p-6">
          <Link href={`/packages/${pkg.slug}`} className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-pine-800 px-6 text-sm font-semibold text-white hover:bg-pine-700">
            Back to journey
          </Link>
          <a
            href={whatsappLink(`Hi Traylborn! I'd like to book ${pkg.title} on ${formatDateLong(date)} for ${breakdown.participants}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-semibold hover:bg-sand-50"
          >
            <WhatsappIcon className="size-4 text-[#25D366]" /> Book on WhatsApp
          </a>
        </div>
      </m.div>
    </div>
  );
}
