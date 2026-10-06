import type { Metadata } from "next";
import { MyTripsDashboard, type TripView } from "@/components/account/my-trips-dashboard";
import { customerBookings, demoCustomer } from "@/lib/mock-data/bookings";
import { getPackageBySlug } from "@/lib/mock-data/packages";

export const metadata: Metadata = { title: "My Trips", robots: { index: false } };

export default function MyTripsPage() {
  const trips: TripView[] = customerBookings.map((b) => {
    const pkg = getPackageBySlug(b.packageSlug);
    return {
      ...b,
      image: pkg?.images[0].src ?? "/images/hero/himalaya-sunrise.jpg",
      durationDays: pkg?.durationDays ?? 1,
      startingPoint: pkg?.startingPoint ?? "",
      category: pkg?.category ?? "treks",
    };
  });

  return <MyTripsDashboard customer={demoCustomer} trips={trips} />;
}
