import Link from "next/link";
import { Search } from "lucide-react";
import { AdminCard, AdminHeader, AdminTable, adminButton } from "@/components/admin/admin-ui";
import { BookingStatusBadge, bookingStatusLabel } from "@/components/booking/booking-status-badge";
import { BUSINESS_TIME_ZONE, formatDate, formatPrice } from "@/lib/utils/format";
import { requireAdmin } from "@/server/auth/session";
import { BOOKING_LIST_LIMIT, BOOKING_STATUSES, listBookings, type BookingStatus } from "@/server/bookings";

export const metadata = { title: "Bookings" };

const created = new Intl.DateTimeFormat("en-IN", { timeZone: BUSINESS_TIME_ZONE, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function AdminBookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  await requireAdmin();
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const status = BOOKING_STATUSES.find((s) => s === query.status) as BookingStatus | undefined;
  const rows = await listBookings({ search: search || undefined, status });
  const filtered = Boolean(search || status);

  return (
    <>
      <AdminHeader
        title="Bookings"
        description={
          rows.length === BOOKING_LIST_LIMIT
            ? `Showing the latest ${BOOKING_LIST_LIMIT}. Search to narrow down.`
            : `${rows.length} ${rows.length === 1 ? "booking" : "bookings"}${filtered ? " found" : ""}`
        }
      />

      <form method="get" className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search bookings</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Reference, name, email or phone"
            className="h-10 w-full rounded-full border border-border bg-white pr-4 pl-10 text-sm outline-none focus:border-pine-600 focus:ring-4 focus:ring-pine-600/10"
          />
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select name="status" defaultValue={status ?? ""} className="h-10 w-full rounded-full border border-border bg-white px-4 text-sm sm:w-auto">
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>{bookingStatusLabel[s]}</option>
            ))}
          </select>
        </label>
        <button type="submit" className={adminButton.secondary}>Filter</button>
        {filtered && <Link href="/admin/bookings" className={adminButton.ghost + " h-10 self-center"}>Clear</Link>}
      </form>

      <AdminCard bodyClassName="p-0">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">{filtered ? "No bookings match." : "No bookings yet."}</p>
        ) : (
          <AdminTable label="Bookings">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Primary traveller</th>
                <th>Trip</th>
                <th>Travellers</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.reference}>
                  <td>
                    <Link href={`/admin/bookings/${b.reference}`} className="font-semibold text-pine-800 hover:underline">
                      {b.reference}
                    </Link>
                  </td>
                  <td>
                    <p className="font-medium text-ink">{b.primaryName}</p>
                    <p className="text-xs text-muted-foreground">{b.primaryPhone}</p>
                  </td>
                  <td>
                    <p className="text-ink">{b.packageTitle}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(b.departureDate)}</p>
                  </td>
                  <td>{b.travellerCount}</td>
                  <td className="font-medium">{formatPrice(b.total)}</td>
                  <td><BookingStatusBadge status={b.status} /></td>
                  <td className="text-xs text-muted-foreground">{created.format(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminCard>
    </>
  );
}
