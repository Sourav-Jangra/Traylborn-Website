"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useBooking } from "./booking-context";
import { addDays, formatDate, parseISODate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

/** Upcoming departures as a scannable list; synced with the booking panel's calendar. */
export function DeparturesList() {
  const { pkg, departures, date, setDate } = useBooking();
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? departures.slice(0, 40) : departures.slice(0, 6);

  return (
    <div>
      <ul className="divide-y divide-border overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
        {list.map((d) => {
          const selected = d.date === date;
          const start = parseISODate(d.date);
          return (
            <li key={d.date}>
              <button
                type="button"
                onClick={() => setDate(d.date)}
                aria-pressed={selected}
                className={cn(
                  "flex w-full items-center gap-4 px-4 py-4 text-left transition-colors sm:px-6",
                  selected ? "bg-pine-50" : "hover:bg-sand-50",
                )}
              >
                <span className={cn("flex w-14 shrink-0 flex-col items-center rounded-2xl py-2", selected ? "bg-pine-800 text-white" : "bg-sand-100 text-ink")}>
                  <span className="text-[0.65rem] font-semibold tracking-wider uppercase">
                    {start.toLocaleDateString("en-IN", { month: "short" })}
                  </span>
                  <span className="font-display text-xl leading-none font-semibold">{start.getDate()}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">
                    {start.toLocaleDateString("en-IN", { weekday: "short" })} → {formatDate(addDays(d.date, pkg.durationDays - 1), { year: undefined, weekday: "short" })}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {pkg.durationDays} days · {pkg.nights} nights
                  </span>
                </span>
                <span
                  className={cn(
                    "hidden h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold sm:inline-flex",
                    selected ? "bg-pine-800 text-white" : "border border-border text-ink",
                  )}
                >
                  {selected ? <><Check className="size-4" /> Selected</> : "Select"}
                </span>
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 sm:hidden", selected ? "border-pine-800 bg-pine-800 text-white" : "border-border")}>
                  {selected && <Check className="size-3.5" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {departures.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-4 text-sm font-semibold text-pine-700 underline-offset-4 hover:underline"
        >
          {showAll ? "Show fewer dates" : `Show more dates (${departures.length} upcoming)`}
        </button>
      )}
    </div>
  );
}
