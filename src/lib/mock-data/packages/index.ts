import type { Category, TravelPackage } from "@/lib/types";
import { treks } from "./treks";
import { roadTrips } from "./road-trips";
import { retreats } from "./retreats";

export const allPackages: TravelPackage[] = [...treks, ...roadTrips, ...retreats];

/** Only published packages are visible on the public site. */
export const packages = allPackages.filter((p) => p.status === "published");

export function getPackageBySlug(slug: string) {
  return packages.find((p) => p.slug === slug);
}

export function getPackagesByCategory(category: Category) {
  return packages.filter((p) => p.category === category);
}

export function getFeaturedPackages() {
  return packages.filter((p) => p.featured);
}

export function getRelatedPackages(pkg: TravelPackage, limit = 3) {
  return packages
    .filter((p) => p.slug !== pkg.slug)
    .sort((a, b) => Number(b.category === pkg.category) - Number(a.category === pkg.category))
    .slice(0, limit);
}

export const destinations = Array.from(new Set(packages.map((p) => p.state))).sort();
