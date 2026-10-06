import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminCard, AdminHeader, AdminTable } from "@/components/admin/admin-ui";
import { BookingNotesForm, CancelBookingForm } from "@/components/admin/booking-controls";
import { BookingStatusBadge } from "@/components/booking/booking-status-badge";
import { BUSINESS_TIME_ZONE, formatDateLong, formatPrice } from "@/lib/utils/format";
import { requireAdmin } from "@/server/auth/session";
import { getBookingByReference } from "@/server/bookings";

export const metadata = { title: "Booking" };

const dateTime = new Intl.DateTimeFormat("en-IN", { timeZone: BUSINESS_TIME_ZONE, dateStyle: "medium", timeStyle: "short" });
const paymentLabel: Record<string, string> = { unpaid: "Unpaid", partially_paid: "Partially paid", paid: "Paid", refunded: "Refunded" };

export default async function AdminBookingPage({ params }: PageProps<"/admin/bookings/[reference]">) {
  await requireAdmin();
  const { reference } = await params;
  const booking = await getBookingByReference(reference);
  if (!booking) notFound();

  const primary = booking.travellers[0];
  const cancellable = ["pending_payment", "expired", "confirmed"].includes(booking.status);

  return (
    <>
      <Link href="/admin/bookings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-ink">
        <ArrowLeft className="size-4" /> All bookings
      </Link>
      <AdminHeader title={booking.reference} description={`Created ${dateTime.format(booking.createdAt)} (IST)`} actions={<BookingStatusBadge status={booking.status} />} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <AdminCard title="Trip">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-2">
              <Item label="Package">
                {booking.packageSlug ? (
                  <Link href={`/admin/packages/${booking.packageSlug}`} className="text-pine-800 hover:underline">{booking.packageTitle}</Link>
                ) : (
                  booking.packageTitle
                )}
              </Item>
              <Item label="Option">{booking.optionLabel}</Item>
              <Item label="Departure">{formatDateLong(booking.departureDate)}</Item>
              <Item label="Returns">{formatDateLong(booking.endDate)}</Item>
              <Item label="Travellers">{booking.travellerCount}</Item>
            </dl>
          </AdminCard>

          <AdminCard title="Primary traveller">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-2">
              <Item label="Name">{primary.fullName}</Item>
              <Item label="Age">{primary.age}</Item>
              <Item label="Email"><a href={`mailto:${primary.email}`} className="text-pine-800 hover:underline">{primary.email}</a></Item>
              <Item label="Phone"><a href={`tel:${primary.phone}`} className="text-pine-800 hover:underline">{primary.phone}</a></Item>
              <Item label="City">{primary.city}</Item>
              <Item label="Emergency contact">{primary.emergencyName} · {primary.emergencyPhone}</Item>
              {booking.customerNotes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Medical / dietary notes</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-ink">{booking.customerNotes}</dd>
                </div>
              )}
            </dl>
          </AdminCard>

          {booking.travellers.length > 1 && (
            <AdminCard title="Other travellers" bodyClassName="p-0">
              <AdminTable label="Other travellers">
                <thead>
                  <tr><th>#</th><th>Name</th><th>Age</th><th>Phone</th><th>Email</th></tr>
                </thead>
                <tbody>
                  {booking.travellers.slice(1).map((t) => (
                    <tr key={t.position}>
                      <td>{t.position}</td>
                      <td className="font-medium text-ink">{t.fullName}</td>
                      <td>{t.age}</td>
                      <td>{t.phone ?? "—"}</td>
                      <td>{t.email ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            </AdminCard>
          )}
        </div>

        <div className="space-y-6">
          <AdminCard title="Payment">
            <dl className="space-y-2.5 p-5 text-sm">
              <Row label={`${formatPrice(booking.unitPrice)} × ${booking.travellerCount}`} value={formatPrice(booking.total)} />
              <Row label="Plan" value={booking.paymentPlan === "advance" ? "Advance" : "Full payment"} />
              <Row label="Due now" value={formatPrice(booking.amountDueNow)} />
              {booking.balance > 0 && <Row label="Balance later" value={formatPrice(booking.balance)} />}
              <Row label="Payment status" value={paymentLabel[booking.paymentStatus] ?? booking.paymentStatus} />
              {booking.status === "pending_payment" && booking.expiresAt && (
                <Row label="Hold expires" value={dateTime.format(booking.expiresAt)} />
              )}
            </dl>
          </AdminCard>

          {booking.status === "cancelled" && (
            <AdminCard title="Cancelled" bodyClassName="p-5">
              <p className="text-sm">{booking.cancellationReason}</p>
              {booking.cancelledAt && <p className="mt-1 text-xs text-muted-foreground">{dateTime.format(booking.cancelledAt)} (IST)</p>}
            </AdminCard>
          )}

          <AdminCard title="Internal notes">
            <div className="p-5">
              <BookingNotesForm reference={booking.reference} initialNotes={booking.adminNotes ?? ""} />
            </div>
          </AdminCard>

          {cancellable && (
            <AdminCard title="Cancel booking">
              <div className="p-5">
                <CancelBookingForm reference={booking.reference} />
              </div>
            </AdminCard>
          )}
        </div>
      </div>
    </>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
