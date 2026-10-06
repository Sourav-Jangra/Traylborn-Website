import { AdminCard, AdminHeader, AdminTable } from "@/components/admin/admin-ui";
import { customerBookings, recentBookings } from "@/lib/mock-data/bookings";
import { formatDate, formatPrice } from "@/lib/utils/format";

export const metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  const map = new Map<string, { name: string; email: string; trips: number; spent: number; last: string }>();
  for (const b of [...recentBookings, ...customerBookings]) {
    const c = map.get(b.customerEmail) ?? { name: b.customerName, email: b.customerEmail, trips: 0, spent: 0, last: b.bookedOn };
    c.trips += 1;
    if (b.status !== "Cancelled") c.spent += b.amount;
    if (b.bookedOn > c.last) c.last = b.bookedOn;
    map.set(b.customerEmail, c);
  }
  const customers = [...map.values()].sort((a, b) => b.spent - a.spent);

  return (
    <>
      <AdminHeader title="Customers" description={`${customers.length} travellers`} />
      <AdminCard>
        <div className="-m-5">
          <AdminTable label="Customers">
            <thead>
              <tr><th>Customer</th><th>Bookings</th><th>Lifetime value</th><th>Last booking</th><th>Segment</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pine-50 text-xs font-bold text-pine-800" aria-hidden="true">
                        {c.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <span><span className="block font-medium">{c.name}</span><span className="block text-xs text-muted-foreground">{c.email}</span></span>
                    </div>
                  </td>
                  <td>{c.trips}</td>
                  <td className="font-semibold">{formatPrice(c.spent)}</td>
                  <td>{formatDate(c.last)}</td>
                  <td>
                    <span className={c.trips > 1 ? "rounded-full bg-ember-500/12 px-2.5 py-1 text-xs font-semibold text-ember-700" : "rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-ink/70"}>
                      {c.trips > 1 ? "Repeat traveller" : "First trip"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </div>
      </AdminCard>
    </>
  );
}
