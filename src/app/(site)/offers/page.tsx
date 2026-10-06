import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/hero/page-hero";
import { PackageCard } from "@/components/packages/package-card";
import { SectionHeading, Accent } from "@/components/layout/section-heading";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { getPublishedPackages } from "@/server/packages";
import { whatsappLink } from "@/lib/mock-data/site";

export const metadata: Metadata = {
  title: "Offers",
  description: "Current Traylborn price drops on treks, road trips and retreats.",
};

export default async function OffersPage() {
  const deals = (await getPublishedPackages())
    .filter((p): p is typeof p & { originalPrice: number } => p.originalPrice != null && p.originalPrice > p.price)
    .sort((a, b) => (b.originalPrice - b.price) / b.originalPrice - (a.originalPrice - a.price) / a.originalPrice);

  return (
    <>
      <PageHero
        eyebrow="Offers"
        title={<>Better trails, <Accent className="text-ember-300">better prices.</Accent></>}
        description="Current price drops on our journeys. No fine-print surcharges, no inflated ‘original’ prices — just honest discounts."
        image="/images/treks/sunset-snow-group.jpg"
        imageAlt="Group of trekkers on a snowy ridge at sunset"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Offers" }]}
      />

      {deals.length > 0 ? (
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
      ) : (
        <section className="container-page py-16 sm:py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[2rem] bg-sand-100 p-8 text-center sm:p-12">
            <h2 className="text-3xl font-semibold sm:text-4xl">No current offers</h2>
            <p className="mt-3 text-muted-foreground">
              There are no price drops running right now. Message us on WhatsApp to hear about the next one, or browse our journeys at regular prices.
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
    </>
  );
}
