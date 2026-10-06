"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { CalendarDays, Search, X } from "lucide-react";
import type { Category, TravelPackage } from "@/lib/types";
import { m } from "@/components/ui/motion";
import { PackageCard } from "@/components/packages/package-card";
import { categories } from "@/lib/mock-data/categories";
import { searchPackages } from "@/lib/utils/search";
import { getDepartures } from "@/lib/utils/departures";
import { upcomingMonths } from "@/lib/utils/filters";
import { cn } from "@/lib/utils";

interface SearchExperienceProps {
  packages: TravelPackage[];
  initialQuery: string;
  initialCategory: Category | "all";
  initialMonth: string;
}

export function SearchExperience({ packages, initialQuery, initialCategory, initialMonth }: SearchExperienceProps) {
  const featured = useMemo(() => packages.filter((p) => p.featured), [packages]);
  const popular = useMemo(
    () => [...new Set(packages.map((p) => p.destination.split(",")[0].trim()).filter(Boolean))].slice(0, 6),
    [packages],
  );
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<Category | "all">(initialCategory);
  const [month, setMonth] = useState(initialMonth);
  const inputRef = useRef<HTMLInputElement>(null);
  const months = useMemo(() => upcomingMonths(9), []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (category !== "all") params.set("category", category);
      if (month) params.set("month", month);
      router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(t);
  }, [query, category, month, pathname, router]);

  const results = useMemo(() => {
    const list = searchPackages(packages, query, category);
    return month ? list.filter((p) => getDepartures(p, 400).some((d) => d.date.startsWith(month))) : list;
  }, [packages, query, category, month]);

  const counts = useMemo(() => {
    const base = searchPackages(packages, query);
    return Object.fromEntries(categories.map((c) => [c.slug, base.filter((p) => p.category === c.slug).length])) as Record<Category, number>;
  }, [packages, query]);
  const totalForQuery = counts.treks + counts["road-trips"] + counts.retreats;

  const hasCriteria = query.trim() || category !== "all" || month;

  return (
    <>
      <section className="border-b border-border bg-white pt-24 pb-6 sm:pt-28">
        <div className="container-page">
          <h1 className="text-3xl font-semibold sm:text-5xl">
            {query.trim() ? (
              <>
                Results for <span className="font-serif font-normal text-pine-700 italic">“{query.trim()}”</span>
              </>
            ) : (
              "Find your next journey"
            )}
          </h1>

          <form role="search" onSubmit={(e) => { e.preventDefault(); inputRef.current?.blur(); }} className="mt-6 flex flex-col gap-3 md:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Search journeys</span>
              <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={popular.length > 0 ? `Try “${popular[0]}” or a season like “summer”` : "Search journeys"}
                autoFocus={!initialQuery}
                className="h-14 w-full rounded-full border border-border bg-sand-50 pr-12 pl-13 text-base outline-none placeholder:text-muted-foreground focus:border-pine-600 focus:bg-white focus:ring-4 focus:ring-pine-600/10 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-sand-100"
                >
                  <X className="size-4" />
                </button>
              )}
            </label>
            <label className="relative md:w-60">
              <span className="sr-only">Departure month</span>
              <CalendarDays className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-14 w-full cursor-pointer appearance-none rounded-full border border-border bg-sand-50 pr-5 pl-12 text-[0.95rem] font-medium outline-none focus:border-pine-600"
              >
                <option value="">Any month</option>
                {months.map((mo) => (
                  <option key={mo.value} value={mo.value}>{mo.label}</option>
                ))}
              </select>
            </label>
          </form>

          <div className="scrollbar-none -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="group" aria-label="Filter by experience">
            {[{ slug: "all" as const, label: "All" }, ...categories].map((c) => {
              const count = c.slug === "all" ? totalForQuery : counts[c.slug];
              const active = category === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c.slug)}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                    active ? "border-pine-800 bg-pine-800 text-white" : "border-border bg-white text-ink/75 hover:border-pine-300",
                  )}
                >
                  {c.label}
                  <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-white/15" : "bg-sand-100")}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-label="Search results" className="container-page py-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <strong className="font-semibold text-ink">{results.length}</strong> {results.length === 1 ? "journey" : "journeys"}
            {hasCriteria ? " match your search" : " available"}
          </p>
          {hasCriteria && (
            <button
              type="button"
              onClick={() => { setQuery(""); setCategory("all"); setMonth(""); }}
              className="text-sm font-semibold text-pine-700 underline-offset-4 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>

        {results.length > 0 ? (
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {results.map((pkg, i) => (
                <m.li
                  key={pkg.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                >
                  <PackageCard pkg={pkg} priority={i < 3} sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" />
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <div className="mt-6">
            <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-12 text-center">
              <p className="font-display text-2xl font-semibold">No journeys found</p>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                We couldn&apos;t find anything for that. Try a destination, a season, or one of these:
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {popular.map((p) => (
                  <button key={p} type="button" onClick={() => { setQuery(p); setMonth(""); setCategory("all"); }} className="rounded-full bg-sand-100 px-4 py-2 text-sm font-medium hover:bg-sand-200">
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {featured.length > 0 && (
              <>
                <h2 className="mt-14 text-2xl font-semibold">Featured journeys</h2>
                <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.slice(0, 3).map((pkg) => (
                    <li key={pkg.id}>
                      <PackageCard pkg={pkg} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {!query.trim() && results.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center gap-2 text-sm">
            <span className="mr-1 text-muted-foreground">Popular searches:</span>
            {popular.map((p) => (
              <button key={p} type="button" onClick={() => setQuery(p)} className="rounded-full border border-border bg-white px-3.5 py-1.5 font-medium hover:border-pine-300">
                {p}
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
