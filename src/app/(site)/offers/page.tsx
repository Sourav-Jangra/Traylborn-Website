import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgePercent } from "lucide-react";
import { PageHero } from "@/components/hero/page-hero";
import { PackageCard } from "@/components/packages/package-card";
import { SectionHeading, Accent } from "@/components/layout/section-heading";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { getPublicOffers } from "@/server/discounts";
import { getPublishedPackages } from "@/server/packages";
import { whatsappLink } from "@/lib/config/site";
import { formatDate } from "@/lib/utils/format";
import { describeDiscount } from "@/lib/utils/pricing";

export const metadata: Metadata = {
  title: "Offers",
  description: "Current Traylborn offers and price drops on treks, road trips and retreats.",
};

export default async function OffersPage() {
  const [packages, offers] = await Promise.all([getPublishedPackages(), getPublicOffers()]);
  const deals = packages
    .filter((p): p is typeof p & { originalPrice: number } => p.originalPrice != null && p.originalPrice > p.price)
    .sort((a, b) => (b.originalPrice - b.price) / b.originalPrice - (a.originalPrice - a.price) / a.originalPrice);
  const live = offers.filter((o) => !o.packageSlug || packages.some((p) => p.slug === o.packageSlug));

  return (
    <>
      <PageHero
        eyebrow="Offers"
        title={<>Better trails, <Accent className="text-ember-300">better prices.</Accent></>}
        description="Current offers and price drops on our journeys. No fine-print surcharges, no inflated ‘original’ prices — just honest discounts."
        image="/images/treks/sunset-snow-group.jpg"
        imageAlt="Group of trekkers on a snowy ridge at sunset"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Offers" }]}
      />

      {live.length > 0 && (
        <section className="container-page pt-14 sm:pt-20">
          <SectionHeading eyebrow="Running now" title={<>Offers taken off <Accent>at checkout</Accent></>} />
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {live.map((o) => (
              <li key={o.id} className="flex flex-col rounded-[1.75rem] bg-white p-6 ring-1 ring-black/5">
                <p className="flex items-center gap-2 text-sm font-semibold text-pine-700">
                  <BadgePercent className="size-4" aria-hidden="true" /> {describeDiscount(o)}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{o.title}</h2>
                {o.description && <p className="mt-2 text-muted-foreground">{o.description}</p>}
                <p className="mt-3 text-sm text-muted-foreground">
                  {o.packageTitle ? `On ${o.packageTitle}` : "On all trips"} · until {formatDate(o.endsOn, { year: "numeric" })}
                </p>
                <Link
                  href={o.packageSlug ? `/packages/${o.packageSlug}` : "/treks"}
                  className="group mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-pine-800"
                >
                  {o.packageSlug ? "View trip" : "Browse trips"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {deals.length > 0 && (
        <section className="container-page py-14 sm:py-20">
          <SectionHeading eyebrow="Price drops" title={<>Journeys on <Accent>sale</Accent> right now</>} />
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {deals.map((pkg) => (
              <li key={pkg.id}>
                <PackageCard pkg={pkg} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {live.length === 0 && deals.length === 0 && (
        <section className="container-page py-16 sm:py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[2rem] bg-sand-100 p-8 text-center sm:p-12">
            <h2 className="text-3xl font-semibold sm:text-4xl">No current offers</h2>
            <p className="mt-3 text-muted-foreground">
              There are no offers running right now. Message us on WhatsApp to hear about the next one, or browse our journeys at regular prices.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink("Hi Traylborn! Please let me know about upcoming offers.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-pine-800 px-6 text-sm font-semibold text-white hover:bg-pine-700"
              >
                <WhatsappIcon className="size-4" /> Ask on WhatsApp
              </a>
              <Link href="/treks" className="inline-flex h-12 items-center justify-center rounded-full border border-pine-800/20 px-6 text-sm font-semibold text-pine-800 hover:bg-white">
                Browse treks
              </Link>
            </div>
          </div>
        </section>
      )}
      {live.length > 0 && deals.length === 0 && <div className="pb-14 sm:pb-20" />}
    </>
  );
}
