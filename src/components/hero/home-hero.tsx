"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { m, EASE } from "@/components/ui/motion";
import { HeroMedia } from "./hero-media";
import { HeroSearch } from "@/components/search/hero-search";
import { Accent } from "@/components/layout/section-heading";
import { categories } from "@/lib/config/categories";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: EASE, delay },
});

export function HomeHero() {
  return (
    <section aria-label="Welcome to Traylborn" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-pine-950 text-white">
      <HeroMedia image="/images/hero/himalaya-sunrise.jpg" alt="Sunrise over snow-capped Himalayan peaks above a sea of clouds" />
      <div className="absolute inset-0 bg-gradient-to-b from-pine-950/55 via-pine-950/25 to-pine-950/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-pine-950/50 to-transparent md:via-transparent" />

      <div className="container-page relative flex flex-1 flex-col justify-end pt-28 pb-8 sm:pb-12 lg:pb-14">
        <div className="max-w-3xl">
          <m.p {...fadeUp(0.1)} className="eyebrow text-ember-300">
            <span className="h-px w-8 bg-ember-300" /> Born of trails · Made for journeys
          </m.p>
          <m.h1
            {...fadeUp(0.2)}
            className="mt-5 text-[3.1rem] leading-[0.95] font-semibold tracking-[-0.03em] sm:text-7xl lg:text-[5.75rem]"
          >
            Go further.
            <br />
            Come back with <Accent className="text-ember-300">stories.</Accent>
          </m.h1>
          <m.p {...fadeUp(0.35)} className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Himalayan treks, road expeditions and mountain retreats — planned end-to-end by a Chandigarh-based team.
          </m.p>
          <m.div {...fadeUp(0.5)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/treks"
              className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ember-500 px-8 font-semibold text-ink transition-colors hover:bg-ember-400"
            >
              Explore Journeys
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-14 items-center justify-center rounded-full border border-white/35 bg-white/10 px-8 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              Plan Your Trip
            </Link>
          </m.div>
        </div>

        <m.div {...fadeUp(0.75)} className="mt-10 hidden md:block lg:mt-14">
          <HeroSearch />
        </m.div>

        <m.nav {...fadeUp(0.7)} aria-label="Browse by experience" className="mt-9 md:hidden">
          <Link
            href="/search"
            className="mb-2 flex h-14 items-center gap-3 rounded-2xl bg-white px-5 text-[0.95rem] text-muted-foreground shadow-xl shadow-black/20"
          >
            <Search className="size-5 text-pine-700" aria-hidden="true" />
            Search treks, places, experiences…
          </Link>
          <ul className="grid grid-cols-3 gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={c.href}
                  className="flex h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-sm font-semibold backdrop-blur-md"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </m.nav>
      </div>
    </section>
  );
}
