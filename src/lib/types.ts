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

/** A bookable price for a package, e.g. "Joshimath" ₹6,999 or "Triple sharing" ₹6,500. Per traveller. */
export interface PriceOption {
  /** Absent only for options not yet saved in the admin editor. */
  id?: number;
  label: string;
  price: number;
  isDefault: boolean;
}

/** `value` is a whole percentage of the total for "percent", or INR per traveller for "fixed". */
export interface AdvancePayment {
  enabled: boolean;
  type: "percent" | "fixed";
  value: number;
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
  /** Lowest option price, derived from priceOptions (see startingPrice in utils/pricing). */
  price: number;
  /** Struck-through comparison for `price`. */
  originalPrice?: number;
  /** Ordered for display; exactly one is the default. */
  priceOptions: PriceOption[];
  advancePayment: AdvancePayment;
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
