import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock, MapPin } from "lucide-react";
import type { TravelPackage } from "@/lib/types";
import { categoryMeta } from "@/lib/mock-data/categories";
import { formatDate, formatPrice, formatShortDuration } from "@/lib/utils/format";
import { getNextDeparture } from "@/lib/utils/departures";
import { Rating } from "./package-meta";
import { cn } from "@/lib/utils";

interface PackageCardProps {
  pkg: TravelPackage;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function PackageCard({
  pkg,
  className,
  sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 45vw, 85vw",
  priority,
}: PackageCardProps) {
  const next = getNextDeparture(pkg);
  const discount = pkg.originalPrice ? Math.round((1 - pkg.price / pkg.originalPrice) * 100) : 0;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-[0_1px_2px_rgba(12,23,22,0.06),0_8px_24px_-12px_rgba(12,23,22,0.12)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(12,23,22,0.06),0_24px_48px_-16px_rgba(12,23,22,0.25)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={pkg.images[0].src}
          alt={pkg.images[0].alt}
          fill
          sizes={sizes}
          preload={priority}
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-semibold tracking-wide text-pine-800 uppercase backdrop-blur">
            {categoryMeta[pkg.category].singular}
          </span>
          {pkg.badge && (
            <span className="rounded-full bg-ember-500 px-3 py-1 text-[0.7rem] font-semibold text-ink">{pkg.badge}</span>
          )}
        </div>
        <div className="absolute inset-x-4 bottom-3 flex items-center justify-between text-white">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="size-3.5" aria-hidden="true" />
            {formatShortDuration(pkg.durationDays, pkg.nights)}
          </span>
          <Rating value={pkg.rating} count={pkg.reviewCount} tone="light" className="text-white" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {pkg.startingPoint === pkg.endingPoint
              ? `${pkg.startingPoint} to ${pkg.endingPoint}`
              : `${pkg.startingPoint} → ${pkg.endingPoint}`}{" "}
            · {pkg.state}
          </span>
        </p>
        <h3 className="mt-2 text-xl leading-snug font-semibold text-ink">
          <Link href={`/packages/${pkg.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {pkg.title}
          </Link>
        </h3>

        {next && (
          <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-pine-50 px-3 py-1 text-xs font-medium text-pine-700">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Next: {formatDate(next.date, { year: undefined })}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-xs text-muted-foreground">
              Starting from
              {discount > 0 && <span className="ml-1.5 text-muted-foreground/80 line-through">{formatPrice(pkg.originalPrice!)}</span>}
            </p>
            <p className="font-display text-2xl font-semibold text-ink">
              {formatPrice(pkg.price)}
              <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">/person</span>
            </p>
          </div>
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-pine-800 text-white transition-colors duration-300 group-hover:bg-ember-500 group-hover:text-ink"
          >
            <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:rotate-45" />
          </span>
        </div>
      </div>
    </article>
  );
}
