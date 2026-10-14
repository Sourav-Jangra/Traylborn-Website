import type { ReactNode } from "react";
import { EyeOff } from "lucide-react";
import { HomeHero, type HeroSlideView } from "@/components/hero/home-hero";
import { TrustBar } from "./trust-bar";
import { FeaturedJourneys } from "./featured-journeys";
import { HomePromos, type PromoView } from "./home-promos";
import { ExperienceCategories } from "./experience-categories";
import { EditorialFeature } from "./editorial-feature";
import { WhyTraylborn } from "./why-traylborn";
import { FinalCta } from "./final-cta";
import type { FinalCtaData, HeadingData, HeroSlideData, PromoData, SpotlightData, TrustBarData, WhyData } from "@/lib/content/types";
import type { SectionKey } from "@/lib/content/schema";
import { getHomeContent, type Section } from "@/server/content";
import { getHomepageOffers } from "@/server/discounts";
import { formatDate } from "@/lib/utils/format";
import { describeDiscount } from "@/lib/utils/pricing";
import { getFeaturedPackages, getPackageBySlug } from "@/server/packages";

/** In the admin preview, marks a section that visitors don't see. */
function Frame({ section, preview, children }: { section: Section; preview: boolean; children: ReactNode }) {
  if (!preview || section.isActive) return children;
  return (
    <div className="relative outline-2 -outline-offset-2 outline-ember-500 outline-dashed">
      <p className="absolute top-3 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ember-500 px-3 py-1 text-xs font-semibold text-ink shadow">
        <EyeOff className="size-3.5" aria-hidden="true" /> Hidden section — not on the live site
      </p>
      {children}
    </div>
  );
}

/**
 * The homepage, built from the content managed in /admin/content. With `preview`, hidden
 * slides, promotions and sections are included and labelled (admin only).
 */
export async function HomeSections({ preview = false }: { preview?: boolean }) {
  const { hero, promos, sections, media } = await getHomeContent({ includeHidden: preview });
  const image = (id: unknown) => {
    const m = typeof id === "number" ? media[id] : undefined;
    return m?.resourceType === "image" ? { src: m.src, alt: m.alt } : null;
  };
  const video = (id: unknown) => {
    const m = typeof id === "number" ? media[id] : undefined;
    return m?.resourceType === "video" ? m.src : null;
  };
  const section = <K extends SectionKey>(key: K) => sections[key];

  const slides: HeroSlideView[] = hero.flatMap((b) => {
    const d = b.data as unknown as HeroSlideData;
    const img = image(d.imageId);
    if (!img) return [];
    return [{
      id: b.id,
      hidden: !b.isActive,
      eyebrow: d.eyebrow,
      title: d.title,
      subtitle: d.subtitle,
      image: img,
      video: video(d.videoId),
      cta: d.ctaLabel && d.ctaHref ? { label: d.ctaLabel, href: d.ctaHref } : null,
      secondaryCta: d.secondaryCtaLabel && d.secondaryCtaHref ? { label: d.secondaryCtaLabel, href: d.secondaryCtaHref } : null,
    }];
  });
  const promoViews: PromoView[] = promos.map((b) => {
    const d = b.data as unknown as PromoData;
    return { ...d, key: `promo-${b.id}`, id: b.id, hidden: !b.isActive, image: image(d.mediaId) };
  });
  // Scheduled offers (managed in /admin/offers) follow the hand-written promotions.
  for (const o of await getHomepageOffers()) {
    const pkg = o.packageSlug ? await getPackageBySlug(o.packageSlug) : undefined;
    if (o.packageSlug && !pkg) continue;
    promoViews.push({
      key: `offer-${o.id}`,
      id: o.id,
      hidden: false,
      eyebrow: `${describeDiscount(o)} · until ${formatDate(o.endsOn)}`,
      title: o.title,
      body: o.description || (pkg ? `Taken off automatically when you book ${pkg.title}.` : "Taken off automatically when you book any of our trips."),
      mediaId: null,
      image: pkg ? { src: pkg.images[0].src, alt: pkg.images[0].alt } : null,
      ctaLabel: pkg ? "View trip" : "See offers",
      ctaHref: pkg ? `/packages/${pkg.slug}` : "/offers",
    });
  }

  const trust = section("home.trust_bar");
  const featured = section("home.featured");
  const categories = section("home.categories");
  const spotlight = section("home.spotlight");
  const why = section("home.why");
  const finalCta = section("home.final_cta");

  const featuredPackages = featured ? await getFeaturedPackages() : [];
  const spotlightData = spotlight?.data as unknown as SpotlightData | undefined;
  const spotlightPackage = spotlightData?.packageSlug ? await getPackageBySlug(spotlightData.packageSlug) : undefined;

  return (
    <>
      <HomeHero slides={slides} />
      {trust && (
        <Frame section={trust} preview={preview}>
          <TrustBar {...(trust.data as unknown as TrustBarData)} />
        </Frame>
      )}
      {featured && (
        <Frame section={featured} preview={preview}>
          <FeaturedJourneys heading={featured.data as unknown as HeadingData} packages={featuredPackages} />
        </Frame>
      )}
      <HomePromos promos={promoViews} />
      {categories && (
        <Frame section={categories} preview={preview}>
          <ExperienceCategories heading={categories.data as unknown as HeadingData} />
        </Frame>
      )}
      {spotlight && spotlightData && spotlightPackage && (
        <Frame section={spotlight} preview={preview}>
          <EditorialFeature pkg={spotlightPackage} content={spotlightData} />
        </Frame>
      )}
      {why && (
        <Frame section={why} preview={preview}>
          <WhyTraylborn content={why.data as unknown as WhyData} image={image((why.data as unknown as WhyData).imageId)} />
        </Frame>
      )}
      {finalCta && (
        <Frame section={finalCta} preview={preview}>
          <FinalCta content={finalCta.data as unknown as FinalCtaData} image={image((finalCta.data as unknown as FinalCtaData).imageId)} />
        </Frame>
      )}
    </>
  );
}
