import Image from "next/image";
import { ArrowRight, EyeOff } from "lucide-react";
import { ContentLink } from "@/components/content/content-link";
import { RichTitle } from "@/components/content/rich-title";
import type { PromoData } from "@/lib/content/types";
import { cn } from "@/lib/utils";

export interface PromoView extends PromoData {
  /** Unique across homepage promotions and scheduled offers. */
  key: string;
  id: number;
  hidden: boolean;
  image: { src: string; alt: string } | null;
}

/** Offers and announcements managed in the homepage admin. Renders nothing when none are live. */
export function HomePromos({ promos }: { promos: PromoView[] }) {
  if (!promos.length) return null;
  return (
    <section aria-label="Offers and announcements" className="container-page pb-20 sm:pb-28">
      <ul className={cn("grid grid-cols-1 gap-4 sm:gap-5", promos.length > 1 && "lg:grid-cols-2", promos.length > 2 && "xl:grid-cols-3")}>
        {promos.map((p) => (
          <li key={p.key} className="relative isolate flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-[2rem] bg-pine-900 p-6 text-white sm:p-8">
            {p.image && (
              <>
                <Image src={p.image.src} alt={p.image.alt} fill sizes="(min-width: 1280px) 30vw, (min-width: 1024px) 45vw, 92vw" className="-z-10 object-cover" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950/90 via-pine-950/50 to-pine-950/10" />
              </>
            )}
            {p.hidden && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">
                <EyeOff className="size-3.5" aria-hidden="true" /> Hidden — not on the live site
              </span>
            )}
            {p.eyebrow && <p className="text-xs font-semibold tracking-[0.18em] text-ember-300 uppercase">{p.eyebrow}</p>}
            <h2 className="mt-2 text-2xl leading-tight font-semibold sm:text-3xl">
              <RichTitle text={p.title} accentClassName="text-ember-300" />
            </h2>
            {p.body && <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-white/80">{p.body}</p>}
            {p.ctaLabel && (
              <ContentLink
                href={p.ctaHref}
                className="group mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-ember-500 px-6 text-sm font-semibold text-ink transition-colors hover:bg-ember-400"
              >
                {p.ctaLabel}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </ContentLink>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
