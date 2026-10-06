import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminHeader, adminButton } from "@/components/admin/admin-ui";
import { PackagesTable, type PackageRow } from "@/components/admin/packages-table";
import { requireAdmin } from "@/server/auth/session";
import { getAllPackages } from "@/server/packages";

export const metadata = { title: "Packages" };

export default async function AdminPackagesPage() {
  await requireAdmin();
  const rows: PackageRow[] = (await getAllPackages()).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    image: p.images[0].src,
    category: p.category,
    region: p.region,
    price: p.price,
    priceOptionCount: p.priceOptions.length,
    durationDays: p.durationDays,
    nights: p.nights,
    departureLabel: p.departureLabel,
    featured: p.featured,
    status: p.status,
    rating: p.rating,
  }));

  return (
    <>
      <AdminHeader
        title="Packages"
        description={`${rows.length} journeys · ${rows.filter((r) => r.status === "published").length} published`}
        actions={
          <Link href="/admin/packages/new" className={adminButton.primary}>
            <Plus className="size-4" /> New package
          </Link>
        }
      />
      <PackagesTable rows={rows} />
    </>
  );
}
