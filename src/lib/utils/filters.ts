import type { Difficulty, TravelPackage } from "@/lib/types";
import { getDepartures, getNextDeparture } from "./departures";
import { searchPackages } from "./search";

export interface PackageFilters {
  query: string;
  destination: string;
  duration: "" | "short" | "medium" | "long";
  price: "" | "under-7k" | "7k-15k" | "over-15k";
  difficulty: Difficulty[];
  month: string;
  sort: "recommended" | "price-asc" | "price-desc" | "rating" | "departure" | "duration";
}

export const defaultFilters: PackageFilters = {
  query: "",
  destination: "",
  duration: "",
  price: "",
  difficulty: [],
  month: "",
  sort: "recommended",
};

export const durationOptions = [
  { value: "short", label: "1–3 days" },
  { value: "medium", label: "4–5 days" },
  { value: "long", label: "6+ days" },
] as const;

export const priceOptions = [
  { value: "under-7k", label: "Under ₹7,000" },
  { value: "7k-15k", label: "₹7,000 – ₹15,000" },
  { value: "over-15k", label: "Above ₹15,000" },
] as const;

export const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "departure", label: "Next departure" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "duration", label: "Shortest first" },
] as const;

export const difficultyOptions: Difficulty[] = ["Easy", "Moderate", "Challenging"];

function matchesDuration(days: number, d: PackageFilters["duration"]) {
  if (d === "short") return days <= 3;
  if (d === "medium") return days >= 4 && days <= 5;
  if (d === "long") return days >= 6;
  return true;
}

function matchesPrice(price: number, p: PackageFilters["price"]) {
  if (p === "under-7k") return price < 7000;
  if (p === "7k-15k") return price >= 7000 && price <= 15000;
  if (p === "over-15k") return price > 15000;
  return true;
}

export function applyFilters(packages: TravelPackage[], f: PackageFilters) {
  const list = searchPackages(packages, f.query).filter(
    (p) =>
      (!f.destination || p.state === f.destination) &&
      matchesDuration(p.durationDays, f.duration) &&
      matchesPrice(p.price, f.price) &&
      (f.difficulty.length === 0 || f.difficulty.includes(p.difficulty)) &&
      (!f.month || getDepartures(p, 400).some((d) => d.date.startsWith(f.month))),
  );

  const nextDate = (p: TravelPackage) => getNextDeparture(p)?.date ?? "9999";
  switch (f.sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "rating":
      return list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "duration":
      return list.sort((a, b) => a.durationDays - b.durationDays);
    case "departure":
      return list.sort((a, b) => nextDate(a).localeCompare(nextDate(b)));
    default:
      return f.query ? list : list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.reviewCount - a.reviewCount);
  }
}

export function activeFilterCount(f: PackageFilters) {
  return [f.destination, f.duration, f.price, f.month].filter(Boolean).length + f.difficulty.length;
}

export function upcomingMonths(count = 9) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    };
  });
}
