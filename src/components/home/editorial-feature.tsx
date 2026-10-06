import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, Mountain, TrendingUp } from "lucide-react";
import { Accent } from "@/components/layout/section-heading";
import { Rating } from "@/components/packages/package-meta";
import { Reveal } from "@/components/ui/motion";
import { getPackageBySlug } from "@/server/packages";
import { getNextDeparture } from "@/lib/utils/departures";
import { formatDate, formatDuration, formatPrice } from "@/lib/utils/format";

export async function EditorialFeature({ slug = "hampta-pass-chandratal" }: { slug?: string }) {
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return null;
  const next = getNextDeparture(pkg);

  const facts = [
    { Icon: Clock, label: "Duration", value: formatDuration(pkg.durationDays, pkg.nights) },
    { Icon: Mountain, label: "Max altitude", value: pkg.maxAltitude ?? "—" },
    { Icon: TrendingUp, label: "Difficulty", value: pkg.difficulty },
    { Icon: CalendarDays, label: "Next departure", value: next ? formatDate(next.date, { year: undefined }) : "On request" },
  ];

  return (
    <section aria-labelledby="editorial-heading" className="py-20 sm:py-28">
      <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] sm:aspect-[5/5] lg:aspect-[4/5]">
            <Image
              src={pkg.images[0].src}
              alt={pkg.images[0].alt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <span className="absolute top-5 left-5 rounded-full bg-ember-500 px-4 py-1.5 text-xs font-semibold text-ink">
              Journey of the season
            </span>
          </div>
          <div className="absolute -right-2 -bottom-8 w-[46%] overflow-hidden rounded-3xl border-[6px] border-background shadow-2xl sm:-right-6 lg:-right-10">
            <div className="relative aspect-[4/5]">
              <Image src={pkg.images[1].src} alt={pkg.images[1].alt} fill sizes="(min-width: 1024px) 20vw, 45vw" className="object-cover" />
            </div>
          </div>
        </Reveal>

        <div className="pt-6 lg:pt-0">
          <p className="eyebrow text-pine-600">
            <span className="h-px w-6 bg-pine-600" /> {pkg.region} · {pkg.state}
          </p>
          <h2 id="editorial-heading" className="mt-3 text-[2.25rem] leading-[1.02] font-semibold sm:text-5xl lg:text-6xl">
            Green valleys to <Accent className="text-pine-600">moon deserts</Accent> in five days.
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-lg font-semibold">{pkg.title}</span>
            <Rating value={pkg.rating} count={pkg.reviewCount} />
          </div>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">{pkg.description.split(". ").slice(0, 3).join(". ")}.</p>

          <dl className="mt-8 grid grid-cols-2 gap-3">
            {facts.map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <Icon className="mt-0.5 size-5 shrink-0 text-pine-600" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-semibold text-ink">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-col gap-5 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                From{" "}
                {pkg.originalPrice && <span className="line-through">{formatPrice(pkg.originalPrice)}</span>}
              </p>
              <p className="font-display text-4xl font-semibold">
                {formatPrice(pkg.price)}
                <span className="ml-1 font-sans text-base font-normal text-muted-foreground">/person</span>
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/packages/${pkg.slug}#dates`}
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-pine-800 px-7 font-semibold text-white transition-colors hover:bg-pine-700"
              >
                See dates & book
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href={`/packages/${pkg.slug}#itinerary`}
                className="inline-flex h-13 items-center justify-center rounded-full border border-pine-800/20 px-7 font-semibold text-pine-800 transition-colors hover:bg-pine-50"
              >
                Itinerary
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
