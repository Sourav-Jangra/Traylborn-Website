import { AdminHeader } from "@/components/admin/admin-ui";
import { ReviewsModeration } from "@/components/admin/reviews-moderation";
import { reviews } from "@/lib/mock-data/reviews";

export const metadata = { title: "Reviews" };

export default function AdminReviewsPage() {
  return (
    <>
      <AdminHeader title="Reviews" description="Approve new reviews and choose which appear on the homepage." />
      <ReviewsModeration reviews={reviews} />
    </>
  );
}
