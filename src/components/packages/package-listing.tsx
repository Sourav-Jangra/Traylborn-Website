"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import type { TravelPackage } from "@/lib/types";
import { m } from "@/components/ui/motion";
import { PackageCard } from "./package-card";
import { FilterControls } from "./filter-controls";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  activeFilterCount,
  applyFilters,
  defaultFilters,
  sortOptions,
  type PackageFilters,
} from "@/lib/utils/filters";

interface PackageListingProps {
  packages: TravelPackage[];
  label: string;
}

export function PackageListing({ packages, label }: PackageListingProps) {
  const [filters, setFilters] = useState<PackageFilters>(defaultFilters);
  const destinations = useMemo(() => Array.from(new Set(packages.map((p) => p.state))).sort(), [packages]);
  const results = useMemo(() => applyFilters([...packages], filters), [packages, filters]);
  const activeCount = activeFilterCount(filters);
  const update = (patch: Partial<PackageFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters((f) => ({ ...defaultFilters, sort: f.sort }));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-28">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-sans text-sm font-semibold">Filter {label.toLowerCase()}</h2>
            {activeCount > 0 && (
              <button type="button" onClick={reset} className="text-sm font-medium text-pine-700 underline-offset-4 hover:underline">
                Clear all
              </button>
            )}
          </div>
          <FilterControls filters={filters} onChange={update} destinations={destinations} />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-16 z-30 -mx-5 flex flex-col gap-3 bg-background/95 px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <div className="flex gap-2 sm:gap-3">
            <label className="relative flex-1">
              <span className="sr-only">Search {label.toLowerCase()}</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={filters.query}
                onChange={(e) => update({ query: e.target.value })}
                placeholder={`Search ${label.toLowerCase()}, places…`}
                className="h-12 w-full rounded-full border border-border bg-white pr-4 pl-11 text-[0.95rem] outline-none placeholder:text-muted-foreground focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10"
              />
            </label>

            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="relative inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold lg:hidden"
                >
                  <SlidersHorizontal className="size-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeCount > 0 && (
                    <span className="grid size-5 place-items-center rounded-full bg-ember-500 text-[0.7rem] text-ink">{activeCount}</span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[88svh] rounded-t-[1.75rem] bg-sand-50 p-0">
                <SheetHeader className="border-b border-border px-5 pt-5 pb-4">
                  <SheetTitle className="font-display text-xl">Filters</SheetTitle>
                  <SheetDescription>{results.length} journeys match</SheetDescription>
                </SheetHeader>
                <div className="overflow-y-auto px-5 py-2">
                  <FilterControls filters={filters} onChange={update} destinations={destinations} />
                </div>
                <div className="flex gap-3 border-t border-border bg-white p-4">
                  <button type="button" onClick={reset} className="h-12 flex-1 rounded-full border border-border font-semibold">
                    Reset
                  </button>
                  <SheetTrigger asChild>
                    <button type="button" className="h-12 flex-[2] rounded-full bg-pine-800 font-semibold text-white">
                      Show {results.length} results
                    </button>
                  </SheetTrigger>
                </div>
              </SheetContent>
            </Sheet>

            <label className="relative hidden shrink-0 sm:block">
              <span className="sr-only">Sort by</span>
              <ArrowUpDown className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as PackageFilters["sort"] })}
                className="h-12 cursor-pointer appearance-none rounded-full border border-border bg-white pr-5 pl-10 text-sm font-medium outline-none focus:border-pine-600"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <strong className="font-semibold text-ink">{results.length}</strong> {results.length === 1 ? "journey" : "journeys"} found
          </p>
          <label className="relative sm:hidden">
            <span className="sr-only">Sort by</span>
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as PackageFilters["sort"] })}
              className="cursor-pointer appearance-none bg-transparent pr-1 text-sm font-semibold text-pine-800 outline-none"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>
          </label>
        </div>

        {results.length > 0 ? (
          <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 min-[1360px]:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {results.map((pkg) => (
                <m.li
                  key={pkg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                >
                  <PackageCard pkg={pkg} sizes="(min-width: 1536px) 28vw, (min-width: 640px) 45vw, 92vw" />
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-border bg-white px-6 py-16 text-center">
            <p className="font-display text-2xl font-semibold">No journeys match those filters</p>
            <p className="mt-2 max-w-sm text-muted-foreground">Try widening your dates or budget — or ask us on WhatsApp and we&apos;ll suggest something similar.</p>
            <button type="button" onClick={reset} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-pine-800 px-6 text-sm font-semibold text-white">
              <X className="size-4" /> Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
