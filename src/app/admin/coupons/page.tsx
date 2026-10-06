import { Plus } from "lucide-react";
import { AdminCard, AdminHeader, adminButton } from "@/components/admin/admin-ui";
import { CouponsTable } from "@/components/admin/coupons-table";
import { coupons } from "@/lib/mock-data/coupons";

export const metadata = { title: "Coupons" };

export default function AdminCouponsPage() {
  return (
    <>
      <AdminHeader
        title="Coupons"
        description="Codes customers can apply at checkout."
        actions={<button type="button" className={adminButton.primary}><Plus className="size-4" /> New coupon</button>}
      />
      <AdminCard>
        <div className="-m-5">
          <CouponsTable coupons={coupons} />
        </div>
      </AdminCard>
    </>
  );
}
