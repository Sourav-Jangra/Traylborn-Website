import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Backpack, Sparkles } from "lucide-react";
import { getPackageBySlug, getRelatedPackages } from "@/server/packages";
import { whatsappLink } from "@/lib/config/site";
import { getDepartures, getNextDeparture } from "@/lib/utils/departures";
import { formatPrice } from "@/lib/utils/format";
import { BookingProvider } from "@/components/booking/booking-context";
import { BookingPanel } from "@/components/booking/booking-panel";
import { MobileBookingBar } from "@/components/booking/mobile-booking-bar";
import { DeparturesList } from "@/components/booking/departures-list";
import { PackageHero } from "@/components/packages/package-hero";
import { PackageOverview } from "@/components/packages/detail/package-overview";
import { SectionNav } from "@/components/packages/detail/section-nav";
import { DetailSection } from "@/components/packages/detail/detail-section";
import { Itinerary } from "@/components/packages/detail/itinerary";
import { Inclusions } from "@/components/packages/detail/inclusions";
import { FaqList } from "@/components/packages/detail/faq-list";
import { Gallery } from "@/components/gallery/gallery";
import { PackageGrid } from "@/components/packages/package-grid";
import { SectionHeading } from "@/components/layout/section-heading";
import { WhatsappIcon } from "@/components/brand/social-icons";

export async function generateMetadata({ params }: PageProps<"/packages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return {};
  return {
    title: `${pkg.title} — ${pkg.durationDays} Days from ${formatPrice(pkg.price)}`,
    description: `${pkg.tagline}. ${pkg.description.slice(0, 140)}…`,
    openGraph: { images: [{ url: pkg.images[0].src }] },
  };
}

export default async function PackagePage({ params }: PageProps<"/packages/[slug]">) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  const departures = getDepartures(pkg, 400);
  const next = getNextDeparture(pkg);
  const related = await getRelatedPackages(pkg);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: pkg.title,
    description: pkg.description,
    image: pkg.images.map((i) => i.src),
    touristType: pkg.category,
    offers: { "@type": "Offer", price: pkg.price, priceCurrency: "INR", availability: "https://schema.org/InStock" },
    ...(pkg.reviewCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: pkg.rating, reviewCount: pkg.reviewCount },
    }),
    itinerary: { "@type": "ItemList", itemListElement: pkg.itinerary.map((d) => ({ "@type": "ListItem", position: d.day, name: d.title })) },
  };

  return (
    <BookingProvider
      pkg={{
        slug: pkg.slug,
        title: pkg.title,
        price: pkg.price,
        originalPrice: pkg.originalPrice,
        durationDays: pkg.durationDays,
        nights: pkg.nights,
        departureLabel: pkg.departureLabel,
        image: pkg.images[0].src,
      }}
      departures={departures}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PackageHero images={pkg.images} title={pkg.title} />

      <div className="container-page grid gap-10 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-14 lg:pt-12 xl:gap-20">
        <div className="min-w-0">
          <PackageOverview pkg={pkg} next={next} />
          <SectionNav showFaq={pkg.faqs.length > 0} />

          <DetailSection id="about" eyebrow="About this journey" title={pkg.tagline}>
            <p className="text-base leading-relaxed text-ink/80 sm:text-lg">{pkg.description}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {pkg.highlights.map((h) => (
                <li key={h} className="flex gap-3 rounded-2xl bg-white p-4 text-[0.95rem] font-medium text-ink ring-1 ring-black/5">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-ember-500" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          </DetailSection>

          <DetailSection id="itinerary" eyebrow={`${pkg.durationDays} days`} title="Day-by-day itinerary">
            <Itinerary days={pkg.itinerary} />
          </DetailSection>

          <DetailSection id="dates" eyebrow={pkg.departureLabel} title="Departure dates">
            <p className="-mt-2 mb-6 text-muted-foreground">
              Pick a date — your selection carries over to the booking panel.
            </p>
            <DeparturesList />
          </DetailSection>

          <DetailSection id="inclusions" eyebrow="Price & inclusions" title={`${formatPrice(pkg.price)} per person`}>
            <Inclusions inclusions={pkg.inclusions} exclusions={pkg.exclusions} />
            {pkg.thingsToCarry && (
              <div className="mt-4 rounded-3xl bg-sand-100 p-6">
                <h3 className="flex items-center gap-2 font-sans text-sm font-semibold tracking-wider text-ink uppercase">
                  <Backpack className="size-4 text-pine-600" aria-hidden="true" /> Things to carry
                </h3>
                <ul className="mt-4 grid gap-2 text-[0.95rem] text-ink/80 sm:grid-cols-2">
                  {pkg.thingsToCarry.map((t) => (
                    <li key={t} className="flex gap-2"><span className="text-pine-600">•</span>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </DetailSection>

          <DetailSection id="gallery" eyebrow="Photos" title="From the trail">
            <Gallery
              className="lg:grid-cols-3"
              items={pkg.images.map((img, i) => ({ ...img, caption: pkg.title, span: i === 0 ? "wide" : "normal" }))}
            />
          </DetailSection>

          {pkg.faqs.length > 0 && (
            <DetailSection id="faq" eyebrow="Good to know" title="Frequently asked questions">
              <FaqList faqs={pkg.faqs} />
            </DetailSection>
          )}

          <div className="flex flex-col gap-5 rounded-[2rem] bg-pine-950 p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h2 className="text-2xl font-semibold">Still have questions?</h2>
              <p className="mt-1.5 text-white/70">Message us on WhatsApp about {pkg.title}.</p>
            </div>
            <a
              href={whatsappLink(`Hi Traylborn! I have a question about ${pkg.title}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 font-semibold text-white hover:bg-[#1fbb59]"
            >
              <WhatsappIcon className="size-5" /> WhatsApp enquiry
            </a>
          </div>
        </div>

        <aside className="hidden lg:block" aria-label="Book this journey">
          <div className="scrollbar-none sticky top-28 max-h-[calc(100svh-8rem)] overflow-y-auto overscroll-contain rounded-[2rem] bg-white shadow-[0_24px_60px_-24px_rgba(12,23,22,0.25)] ring-1 ring-black/5">
            <BookingPanel />
          </div>
        </aside>
      </div>

      <section aria-labelledby="related-heading" className="bg-sand-100 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Keep exploring" title={<span id="related-heading">You might also like</span>} />
          <PackageGrid packages={related} className="mt-10" />
        </div>
      </section>

      <MobileBookingBar />
    </BookingProvider>
  );
}
