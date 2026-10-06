import type { Metadata } from "next";
import { CategoryPage } from "@/components/packages/category-page";
import { categoryMeta } from "@/lib/config/categories";

export const metadata: Metadata = {
  title: "Himalayan Treks",
  description: categoryMeta.treks.description,
};

export default function TreksPage() {
  return <CategoryPage category="treks" />;
}
