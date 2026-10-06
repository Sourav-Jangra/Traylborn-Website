"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import {
  difficultyOptions,
  durationOptions,
  priceOptions,
  upcomingMonths,
  type PackageFilters,
} from "@/lib/utils/filters";
import { cn } from "@/lib/utils";

interface FilterControlsProps {
  filters: PackageFilters;
  onChange: (patch: Partial<PackageFilters>) => void;
  destinations: string[];
}

export function FilterControls({ filters, onChange, destinations }: FilterControlsProps) {
  const months = upcomingMonths();

  return (
    <div className="space-y-7">
      {destinations.length > 1 && (
        <FilterGroup legend="Destination">
          <Chip active={!filters.destination} onClick={() => onChange({ destination: "" })}>All</Chip>
          {destinations.map((d) => (
            <Chip key={d} active={filters.destination === d} onClick={() => onChange({ destination: filters.destination === d ? "" : d })}>
              {d}
            </Chip>
          ))}
        </FilterGroup>
      )}

      <FilterGroup legend="Duration">
        {durationOptions.map((o) => (
          <Chip key={o.value} active={filters.duration === o.value} onClick={() => onChange({ duration: filters.duration === o.value ? "" : o.value })}>
            {o.label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup legend="Budget per person">
        {priceOptions.map((o) => (
          <Chip key={o.value} active={filters.price === o.value} onClick={() => onChange({ price: filters.price === o.value ? "" : o.value })}>
            {o.label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup legend="Difficulty">
        {difficultyOptions.map((d) => {
          const active = filters.difficulty.includes(d);
          return (
            <Chip
              key={d}
              active={active}
              onClick={() =>
                onChange({ difficulty: active ? filters.difficulty.filter((x) => x !== d) : [...filters.difficulty, d] })
              }
            >
              {active && <Check className="size-3.5" aria-hidden="true" />}
              {d}
            </Chip>
          );
        })}
      </FilterGroup>

      <FilterGroup legend="Departure month">
        <div className="grid w-full grid-cols-3 gap-2">
          {months.map((mo) => (
            <button
              key={mo.value}
              type="button"
              aria-pressed={filters.month === mo.value}
              onClick={() => onChange({ month: filters.month === mo.value ? "" : mo.value })}
              className={cn(
                "rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
                filters.month === mo.value
                  ? "border-pine-800 bg-pine-800 text-white"
                  : "border-border bg-white text-ink hover:border-pine-400",
              )}
            >
              {mo.label}
            </button>
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-semibold tracking-[0.14em] text-ink uppercase">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-pine-800 bg-pine-800 text-white" : "border-border bg-white text-ink hover:border-pine-400",
      )}
    >
      {children}
    </button>
  );
}
