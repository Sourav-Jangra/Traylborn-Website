import type { Category } from "@/lib/types";

export interface CategoryMeta {
  slug: Category;
  label: string;
  singular: string;
  href: string;
  eyebrow: string;
  headline: string;
  description: string;
  image: string;
  imageAlt: string;
}

export const categoryMeta: Record<Category, CategoryMeta> = {
  treks: {
    slug: "treks",
    label: "Treks",
    singular: "Trek",
    href: "/treks",
    eyebrow: "Himalayan Treks",
    headline: "Summits, meadows & starlit camps",
    description:
      "Guided Himalayan treks for first-timers and seasoned hikers — summits, meadows and campsites you'll talk about for years.",
    image: "/images/treks/snow-ridge-trekker.jpg",
    imageAlt: "A trekker walking along a snow-covered Himalayan ridge",
  },
  "road-trips": {
    slug: "road-trips",
    label: "Road Trips",
    singular: "Road Trip",
    href: "/road-trips",
    eyebrow: "Road Expeditions",
    headline: "High passes, monasteries & open roads",
    description:
      "Himalayan road trips — high passes, monasteries and open roads.",
    image: "/images/road-trips/key-monastery-snow.jpg",
    imageAlt: "Key Monastery in Spiti Valley surrounded by snow",
  },
  retreats: {
    slug: "retreats",
    label: "Retreats",
    singular: "Retreat",
    href: "/retreats",
    eyebrow: "Wellness Retreats",
    headline: "Slow down in the mountains",
    description:
      "Yoga, mindfulness and gentle adventure in the foothills — retreats designed to leave you rested, not just entertained.",
    image: "/images/retreats/outdoor-yoga-group.jpg",
    imageAlt: "A group practising yoga outdoors in a mountain garden",
  },
};

export const categories = Object.values(categoryMeta);
