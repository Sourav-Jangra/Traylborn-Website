import { AdminHeader } from "@/components/admin/admin-ui";
import { CouponManager, type CouponRow } from "@/components/admin/discount-manager";
import { requireAdmin } from "@/server/auth/session";
import { couponStatus, listCoupons } from "@/server/discounts";
import { getAllPackages } from "@/server/packages";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  await requireAdmin();
  const [coupons, packages] = await Promise.all([listCoupons(), getAllPackages()]);
  const rows: CouponRow[] = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    type: c.type,
    value: c.value,
    packageId: c.packageId,
    packageTitle: c.packageTitle,
    startsOn: c.startsOn,
    endsOn: c.endsOn,
    isActive: c.isActive,
    status: couponStatus(c),
    timesUsed: c.timesUsed,
  }));

  return (
    <>
      <AdminHeader
        title="Coupons"
        description="Codes customers type at checkout. A booking gets one discount: the coupon or a running offer, whichever saves more."
      />
      <CouponManager coupons={rows} packages={packages.map((p) => ({ id: Number(p.id), title: p.title, status: p.status }))} />
    </>
  );
}
