import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageEditor, type EditablePackage } from "@/components/admin/package-editor";
import { getPackageForAdmin } from "@/server/packages";

const blank: EditablePackage = {
  slug: "",
  title: "",
  tagline: "",
  category: "treks",
  region: "",
  durationDays: 1,
  nights: 0,
  difficulty: "Moderate",
  startingPoint: "",
  endingPoint: "",
  groupSize: "",
  price: 0,
  images: [],
  description: "",
  highlights: [],
  inclusions: [],
  exclusions: [],
  itinerary: [{ day: 1, title: "", description: "" }],
  departureRule: { type: "fixed", dates: [] },
  featured: false,
  status: "draft",
};

export async function generateMetadata({ params }: PageProps<"/admin/packages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pkg = await getPackageForAdmin(slug);
  return { title: pkg ? `Edit ${pkg.title}` : "New package" };
}

export default async function EditPackagePage({ params }: PageProps<"/admin/packages/[slug]">) {
  const { slug } = await params;
  if (slug === "new") return <PackageEditor initial={blank} isNew />;

  const pkg = await getPackageForAdmin(slug);
  if (!pkg) notFound();

  const initial: EditablePackage = {
    slug: pkg.slug,
    title: pkg.title,
    tagline: pkg.tagline,
    category: pkg.category,
    region: pkg.region,
    durationDays: pkg.durationDays,
    nights: pkg.nights,
    difficulty: pkg.difficulty,
    startingPoint: pkg.startingPoint,
    endingPoint: pkg.endingPoint,
    groupSize: pkg.groupSize,
    price: pkg.price,
    originalPrice: pkg.originalPrice,
    images: pkg.images,
    description: pkg.description,
    highlights: pkg.highlights,
    inclusions: pkg.inclusions,
    exclusions: pkg.exclusions,
    itinerary: pkg.itinerary,
    departureRule: pkg.departureRule,
    featured: pkg.featured,
    status: pkg.status,
    badge: pkg.badge,
  };

  return <PackageEditor initial={initial} isNew={false} />;
}
