"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Departure } from "@/lib/utils/departures";

export interface BookingPackageInfo {
  slug: string;
  title: string;
  price: number;
  originalPrice?: number;
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

  const value = useMemo(() => {
    const selectedDeparture = departures.find((d) => d.date === date);
    const params = new URLSearchParams({ pax: String(participants) });
    if (date) params.set("date", date);
    return {
      pkg,
      departures,
      date,
      setDate,
      participants,
      setParticipants,
      selectedDeparture,
      bookHref: `/book/${pkg.slug}?${params}`,
    };
  }, [pkg, departures, date, participants]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}
