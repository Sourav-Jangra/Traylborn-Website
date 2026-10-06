import type { Metadata } from "next";
import { CategoryPage } from "@/components/packages/category-page";
import { categoryMeta } from "@/lib/mock-data/categories";

export const metadata: Metadata = {
  title: "Road Trips",
  description: categoryMeta["road-trips"].description,
};

export default function RoadTripsPage() {
  return <CategoryPage category="road-trips" />;
}
