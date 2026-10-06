import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading, Accent } from "@/components/layout/section-heading";
import { Carousel, CarouselItem } from "@/components/packages/package-carousel";
import { PackageCard } from "@/components/packages/package-card";
import { getFeaturedPackages } from "@/server/packages";

export async function FeaturedJourneys() {
  const featured = await getFeaturedPackages();

  return (
    <section aria-labelledby="featured-heading" className="overflow-hidden py-20 sm:py-28">
      <div className="container-page">
        <Carousel
          label="Featured journeys"
          header={
            <SectionHeading
              eyebrow="Upcoming departures"
              title={
                <span id="featured-heading">
                  Journeys our travellers <Accent className="text-pine-600">love</Accent>
                </span>
              }
              description="Hand-picked journeys with departures this season."
            />
          }
        >
          {featured.map((pkg) => (
            <CarouselItem key={pkg.id}>
              <PackageCard pkg={pkg} sizes="(min-width: 640px) 352px, 82vw" />
            </CarouselItem>
          ))}
        </Carousel>
        <Link
          href="/search"
          className="group mt-2 inline-flex items-center gap-2 font-semibold text-pine-800 hover:text-pine-600"
        >
          View all journeys
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
