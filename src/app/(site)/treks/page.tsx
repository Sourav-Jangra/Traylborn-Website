import type { Metadata } from "next";
import { CategoryPage } from "@/components/packages/category-page";
import { categoryMeta } from "@/lib/mock-data/categories";

export const metadata: Metadata = {
  title: "Himalayan Treks",
  description: categoryMeta.treks.description,
};

export default function TreksPage() {
  return <CategoryPage category="treks" />;
}
