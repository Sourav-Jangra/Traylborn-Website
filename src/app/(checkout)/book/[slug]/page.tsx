import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPackageBySlug } from "@/server/packages";
import { getDepartures, MAX_PARTICIPANTS } from "@/lib/utils/departures";
import { BookingFlow } from "@/components/booking/flow/booking-flow";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function BookPage({ params, searchParams }: PageProps<"/book/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  const departures = getDepartures(pkg, 400);
  const requestedDate = typeof query.date === "string" ? query.date : undefined;
  const initialDate = departures.some((d) => d.date === requestedDate) ? requestedDate! : null;
  const pax = Number(typeof query.pax === "string" ? query.pax : 2);
  const initialParticipants = Number.isFinite(pax) ? Math.min(MAX_PARTICIPANTS, Math.max(1, Math.round(pax))) : 2;

  return (
    <BookingFlow
      pkg={{
        slug: pkg.slug,
        title: pkg.title,
        price: pkg.price,
        originalPrice: pkg.originalPrice,
        durationDays: pkg.durationDays,
        nights: pkg.nights,
        departureLabel: pkg.departureLabel,
        image: pkg.images[0].src,
        startingPoint: pkg.startingPoint,
        endingPoint: pkg.endingPoint,
        category: pkg.category,
      }}
      departures={departures}
      initialDate={initialDate}
      initialParticipants={initialParticipants}
    />
  );
}
