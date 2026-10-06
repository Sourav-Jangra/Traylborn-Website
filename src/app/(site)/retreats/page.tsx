import type { Metadata } from "next";
import { CategoryPage } from "@/components/packages/category-page";
import { categoryMeta } from "@/lib/config/categories";

export const metadata: Metadata = {
  title: "Wellness Retreats",
  description: categoryMeta.retreats.description,
};

export default function RetreatsPage() {
  return <CategoryPage category="retreats" />;
}
