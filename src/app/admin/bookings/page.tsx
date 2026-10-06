import { AdminHeader } from "@/components/admin/admin-ui";
import { BookingsTable } from "@/components/admin/bookings-table";
import { customerBookings, recentBookings } from "@/lib/mock-data/bookings";

export const metadata = { title: "Bookings" };

export default function AdminBookingsPage() {
  const all = [...recentBookings, ...customerBookings].sort((a, b) => b.bookedOn.localeCompare(a.bookedOn));
  return (
    <>
      <AdminHeader title="Bookings" description="Every booking across all journeys. Payments will sync from Razorpay in production." />
      <BookingsTable bookings={all} />
    </>
  );
}
