// Shapes of validated content (see schema.ts). Data is validated on save, so these are
// views of what the database holds, not a second source of truth.

export interface HeroSlideData {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageId: number;
  videoId: number | null;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export interface PromoData {
  eyebrow: string;
  title: string;
  body: string;
  mediaId: number | null;
  ctaLabel: string;
  ctaHref: string;
}

export interface HeadingData {
  eyebrow: string;
  title: string;
  description: string;
}

export interface TrustBarData {
  items: { icon: string; label: string }[];
}

export interface SpotlightData {
  packageSlug: string;
  badge: string;
  title: string;
}

export interface WhyData extends HeadingData {
  imageId: number;
  pillars: { icon: string; title: string; body: string }[];
}

export interface FinalCtaData {
  eyebrow: string;
  title: string;
  body: string;
  imageId: number;
  ctaLabel: string;
  ctaHref: string;
  whatsappLabel: string;
  whatsappMessage: string;
}
