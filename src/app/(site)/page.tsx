import { HomeHero } from "@/components/hero/home-hero";
import { TrustBar } from "@/components/home/trust-bar";
import { FeaturedJourneys } from "@/components/home/featured-journeys";
import { ExperienceCategories } from "@/components/home/experience-categories";
import { WhyTraylborn } from "@/components/home/why-traylborn";
import { EditorialFeature } from "@/components/home/editorial-feature";
import { FinalCta } from "@/components/home/final-cta";
import { siteConfig } from "@/lib/config/site";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Traylborn",
  url: siteConfig.url,
  telephone: siteConfig.phone,
  email: siteConfig.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.line1,
    addressLocality: siteConfig.address.city,
    postalCode: siteConfig.address.postalCode,
    addressCountry: "IN",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomeHero />
      <TrustBar />
      <FeaturedJourneys />
      <ExperienceCategories />
      <EditorialFeature />
      <WhyTraylborn />
      <FinalCta />
    </>
  );
}
