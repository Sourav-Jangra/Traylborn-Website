export type Category = "treks" | "road-trips" | "retreats";

export type Difficulty = "Easy" | "Moderate" | "Challenging";

export type PackageStatus = "published" | "draft" | "archived";

export type Season = "Summer" | "Winter" | "Monsoon" | "Autumn" | "Spring";

/**
 * Departure rules model how the real platform will generate bookable dates.
 * - daily:  every day from `startDate` until `endDate`
 * - weekly: on the given weekdays (0 = Sunday … 6 = Saturday)
 * - fixed:  a hand-picked list of dates
 */
export type DepartureRule =
  | { type: "daily"; startDate: string; endDate: string; blackoutDates?: string[] }
  | { type: "weekly"; weekdays: number[]; startDate: string; endDate: string }
  | { type: "fixed"; dates: string[] };

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  altitude?: string;
  distance?: string;
  stay?: string;
  meals?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface PackageImage {
  src: string;
  alt: string;
}

export interface TravelPackage {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: Category;
  region: string;
  state: string;
  destination: string;
  startingPoint: string;
  endingPoint: string;
  durationDays: number;
  nights: number;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  difficulty: Difficulty;
  maxAltitude?: string;
  distance?: string;
  bestSeason: Season[];
  groupSize: string;
  ageLimit: string;
  images: PackageImage[];
  video?: string;
  description: string;
  highlights: string[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  thingsToCarry?: string[];
  faqs: FAQ[];
  departureRule: DepartureRule;
  departureLabel: string;
  featured: boolean;
  status: PackageStatus;
  tags: string[];
  badge?: string;
}

export interface GalleryItem {
  src: string;
  alt: string;
  caption: string;
  span?: "tall" | "wide" | "normal";
}
