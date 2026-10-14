import { AdminHeader } from "@/components/admin/admin-ui";
import { OfferManager, type OfferRow } from "@/components/admin/discount-manager";
import { requireAdmin } from "@/server/auth/session";
import { listOffers, offerStatus } from "@/server/discounts";
import { getAllPackages } from "@/server/packages";

export const metadata = { title: "Offers" };

export default async function AdminOffersPage() {
  await requireAdmin();
  const [offers, packages] = await Promise.all([listOffers(), getAllPackages()]);
  const rows: OfferRow[] = offers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    type: o.type,
    value: o.value,
    packageId: o.packageId,
    packageTitle: o.packageTitle,
    startsOn: o.startsOn,
    endsOn: o.endsOn,
    isActive: o.isActive,
    showOnHomepage: o.showOnHomepage,
    status: offerStatus(o),
    timesUsed: o.timesUsed,
  }));

  return (
    <>
      <AdminHeader
        title="Offers"
        description="Discounts applied automatically between two dates, with no code needed. A booking gets one discount: the best running offer or the customer's coupon, whichever saves more."
      />
      <OfferManager offers={rows} packages={packages.map((p) => ({ id: Number(p.id), title: p.title, status: p.status }))} />
    </>
  );
}
