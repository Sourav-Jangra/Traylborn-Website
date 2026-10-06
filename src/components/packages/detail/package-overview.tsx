import Link from "next/link";
import { CalendarDays, Clock, Gauge, MapPin, Mountain, Route, Sun, Users } from "lucide-react";
import type { TravelPackage } from "@/lib/types";
import { categoryMeta } from "@/lib/mock-data/categories";
import { DifficultyBadge, Rating } from "@/components/packages/package-meta";
import { ShareButton } from "./share-button";
import { formatDate, formatDuration } from "@/lib/utils/format";
import type { Departure } from "@/lib/utils/departures";

export function PackageOverview({ pkg, next }: { pkg: TravelPackage; next?: Departure }) {
  const meta = categoryMeta[pkg.category];
  const facts = [
    { Icon: Clock, label: "Duration", value: formatDuration(pkg.durationDays, pkg.nights) },
    { Icon: Route, label: "Start → End", value: `${pkg.startingPoint} → ${pkg.endingPoint}` },
    { Icon: Mountain, label: "Max altitude", value: pkg.maxAltitude ?? "" },
    { Icon: Gauge, label: "Difficulty", value: pkg.difficulty },
    { Icon: Users, label: "Group size", value: pkg.groupSize },
    { Icon: Sun, label: "Best season", value: pkg.bestSeason.join(", ") },
  ].filter((f) => f.value);

  return (
    <div>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={meta.href} className="hover:text-ink">{meta.label}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-ink">{pkg.title}</li>
        </ol>
      </nav>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-pine-800 px-3 py-1 text-xs font-semibold text-white">{meta.singular}</span>
        <DifficultyBadge level={pkg.difficulty} />
        {pkg.badge && <span className="rounded-full bg-ember-500 px-3 py-1 text-xs font-semibold text-ink">{pkg.badge}</span>}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <h1 className="text-[2.25rem] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-5xl lg:text-6xl">{pkg.title}</h1>
        <ShareButton title={pkg.title} />
      </div>
      <p className="mt-3 text-lg text-muted-foreground">{pkg.tagline}</p>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {pkg.reviewCount > 0 && (
          <a href="#reviews" className="hover:underline">
            <Rating value={pkg.rating} count={pkg.reviewCount} />
          </a>
        )}
        <span className="flex items-center gap-1.5 text-ink/80">
          <MapPin className="size-4 text-pine-600" aria-hidden="true" /> {pkg.destination}
        </span>
        {next && (
          <span className="flex items-center gap-1.5 text-ink/80">
            <CalendarDays className="size-4 text-pine-600" aria-hidden="true" /> Next departure {formatDate(next.date)}
          </span>
        )}
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-border ring-1 ring-border sm:grid-cols-3">
        {facts.map(({ Icon, label, value }) => (
          <div key={label} className="flex gap-3 bg-white p-4 sm:p-5">
            <Icon className="mt-0.5 size-5 shrink-0 text-pine-600" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink sm:text-[0.95rem]">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
