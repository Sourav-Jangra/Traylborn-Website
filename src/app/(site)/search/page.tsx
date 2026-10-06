import type { Metadata } from "next";
import type { Category } from "@/lib/types";
import { SearchExperience } from "@/components/search/search-experience";
import { getPublishedPackages } from "@/server/packages";

export const metadata: Metadata = {
  title: "Search journeys",
  description: "Search Traylborn treks, road trips and retreats by destination, experience and departure month.",
};

const validCategories = ["treks", "road-trips", "retreats"];

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" && validCategories.includes(params.category) ? (params.category as Category) : "all";
  const month = typeof params.month === "string" && /^\d{4}-\d{2}$/.test(params.month) ? params.month : "";

  const packages = await getPublishedPackages();

  return <SearchExperience packages={packages} initialQuery={q} initialCategory={category} initialMonth={month} />;
}
