"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, EyeOff, Search } from "lucide-react";
import { m, EASE } from "@/components/ui/motion";
import { HeroMedia } from "./hero-media";
import { HeroSearch } from "@/components/search/hero-search";
import { ContentLink } from "@/components/content/content-link";
import { RichTitle } from "@/components/content/rich-title";
import { categories } from "@/lib/config/categories";
import { cn } from "@/lib/utils";

export interface HeroSlideView {
  id: number;
  /** Only in the admin preview: the slide isn't on the live site. */
  hidden: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: { src: string; alt: string };
  video: string | null;
  cta: { label: string; href: string } | null;
  secondaryCta: { label: string; href: string } | null;
}

const ROTATE_MS = 7000;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease: EASE, delay },
});

export function HomeHero({ slides }: { slides: HeroSlideView[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const slide = slides[index] ?? slides[0];

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  return (
    <section
      aria-label="Welcome to Traylborn"
      aria-roledescription={count > 1 ? "carousel" : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-pine-950 text-white"
    >
      {slides.map((s, i) => (
        <div key={s.id} className={cn("absolute inset-0 transition-opacity duration-1000", i === index ? "opacity-100" : "opacity-0")} aria-hidden={i !== index}>
          <HeroMedia image={s.image.src} alt={s.image.alt} video={i === index ? s.video ?? undefined : undefined} priority={i === 0} />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-pine-950/55 via-pine-950/25 to-pine-950/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-pine-950/50 to-transparent md:via-transparent" />

      <div className="container-page relative flex flex-1 flex-col justify-end pt-28 pb-8 sm:pb-12 lg:pb-14">
        {slide && (
          <div key={slide.id} className="max-w-3xl">
            {slide.hidden && (
              <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">
                <EyeOff className="size-3.5" aria-hidden="true" /> Hidden slide — not on the live site
              </p>
            )}
            {slide.eyebrow && (
              <m.p {...fadeUp(0.1)} className="eyebrow text-ember-300">
                <span className="h-px w-8 bg-ember-300" /> {slide.eyebrow}
              </m.p>
            )}
            <m.h1
              {...fadeUp(0.2)}
              className="mt-5 text-[3.1rem] leading-[0.95] font-semibold tracking-[-0.03em] sm:text-7xl lg:text-[5.75rem]"
            >
              <RichTitle text={slide.title} accentClassName="text-ember-300" />
            </m.h1>
            {slide.subtitle && (
              <m.p {...fadeUp(0.35)} className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                {slide.subtitle}
              </m.p>
            )}
            {(slide.cta || slide.secondaryCta) && (
              <m.div {...fadeUp(0.5)} className="mt-8 flex flex-col gap-3 sm:flex-row">
                {slide.cta && (
                  <ContentLink
                    href={slide.cta.href}
                    className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ember-500 px-8 font-semibold text-ink transition-colors hover:bg-ember-400"
                  >
                    {slide.cta.label}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </ContentLink>
                )}
                {slide.secondaryCta && (
                  <ContentLink
                    href={slide.secondaryCta.href}
                    className="inline-flex h-14 items-center justify-center rounded-full border border-white/35 bg-white/10 px-8 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                  >
                    {slide.secondaryCta.label}
                  </ContentLink>
                )}
              </m.div>
            )}
          </div>
        )}

        {count > 1 && (
          <div className="mt-8 flex gap-2" role="group" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1} of ${count}`}
                aria-current={i === index ? "true" : undefined}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-8 bg-ember-300" : "w-4 bg-white/45 hover:bg-white/70")}
              />
            ))}
          </div>
        )}

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
