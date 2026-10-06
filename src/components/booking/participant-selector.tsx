"use client";

import { Minus, Plus, Users } from "lucide-react";
import { MAX_PARTICIPANTS } from "@/lib/utils/departures";
import { cn } from "@/lib/utils";

interface ParticipantSelectorProps {
  value: number;
  onChange: (n: number) => void;
  className?: string;
}

export function ParticipantSelector({ value, onChange, className }: ParticipantSelectorProps) {
  const max = MAX_PARTICIPANTS;
  const clamp = (n: number) => Math.max(1, Math.min(max, Number.isFinite(n) ? Math.round(n) : 1));
  const atMax = value >= max;

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-3 pl-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-pine-50 text-pine-700">
            <Users className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p id="participants-label" className="font-semibold text-ink">Travellers</p>
            <p className="truncate text-xs text-muted-foreground">Max {max} per booking</p>
          </div>
        </div>
        <div className="flex items-center gap-1" role="group" aria-labelledby="participants-label">
          <button
            type="button"
            onClick={() => onChange(clamp(value - 1))}
            disabled={value <= 1}
            aria-label="Remove a traveller"
            className="grid size-10 place-items-center rounded-full border border-border text-ink transition-colors hover:border-pine-600 disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={value}
            onChange={(e) => onChange(clamp(e.target.valueAsNumber))}
            aria-label="Number of travellers"
            className="w-11 [appearance:textfield] bg-transparent text-center font-display text-xl font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => onChange(clamp(value + 1))}
            disabled={atMax}
            aria-label="Add a traveller"
            className="grid size-10 place-items-center rounded-full border border-border text-ink transition-colors hover:border-pine-600 disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      <p
        aria-live="polite"
        className={cn("mt-2 text-xs text-ember-600 transition-opacity", atMax ? "opacity-100" : "sr-only opacity-0")}
      >
        Bookings are limited to {MAX_PARTICIPANTS} travellers. For larger groups, please contact us.
      </p>
    </div>
  );
}
