"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Departure } from "@/lib/utils/departures";
import { defaultOption, quotePrice, type PackagePricing, type PriceQuote } from "@/lib/utils/pricing";

export interface BookingPackageInfo {
  slug: string;
  title: string;
  /** Lowest option price, for "starting from" displays. */
  price: number;
  originalPrice?: number;
  pricing: PackagePricing;
  durationDays: number;
  nights: number;
  departureLabel: string;
  image: string;
}

interface BookingState {
  pkg: BookingPackageInfo;
  departures: Departure[];
  date: string | null;
  setDate: (date: string | null) => void;
  participants: number;
  setParticipants: (n: number) => void;
  optionId: number;
  setOptionId: (id: number) => void;
  quote: PriceQuote;
  selectedDeparture?: Departure;
  bookHref: string;
}

const BookingContext = createContext<BookingState | null>(null);

export function BookingProvider({
  pkg,
  departures,
  children,
}: {
  pkg: BookingPackageInfo;
  departures: Departure[];
  children: ReactNode;
}) {
  const [date, setDate] = useState<string | null>(null);
  const [participants, setParticipants] = useState(2);
  const [optionId, setOptionId] = useState(() => defaultOption(pkg.pricing.priceOptions).id!);

  const value = useMemo(() => {
    const selectedDeparture = departures.find((d) => d.date === date);
    const params = new URLSearchParams({ pax: String(participants), option: String(optionId) });
    if (date) params.set("date", date);
    return {
      pkg,
      departures,
      date,
      setDate,
      participants,
      setParticipants,
      optionId,
      setOptionId,
      quote: quotePrice(pkg.pricing, { optionId, travellers: participants }),
      selectedDeparture,
      bookHref: `/book/${pkg.slug}?${params}`,
    };
  }, [pkg, departures, date, participants, optionId]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}
