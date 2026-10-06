"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import type { Booking, BookingStatus } from "@/lib/types";
import { StatusBadge } from "@/components/booking/status-badge";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { AdminTable, adminButton } from "./admin-ui";
import { cn } from "@/lib/utils";

const statuses: (BookingStatus | "All")[] = ["All", "Confirmed", "Pending payment", "Completed", "Cancelled"];

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const [status, setStatus] = useState<BookingStatus | "All">("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (status === "All" || b.status === status) &&
          `${b.id} ${b.customerName} ${b.tripName} ${b.customerEmail}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [bookings, status, query],
  );
  const total = filtered.reduce((s, b) => s + (b.status === "Cancelled" ? 0 : b.amount), 0);

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-none flex gap-1 overflow-x-auto">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={cn("h-9 shrink-0 rounded-full px-4 text-sm font-medium", status === s ? "bg-pine-800 text-white" : "text-ink/70 hover:bg-sand-100")}
            >
              {s} <span className="opacity-60">{s === "All" ? bookings.length : bookings.filter((b) => b.status === s).length}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <label className="relative flex-1 lg:w-64">
            <span className="sr-only">Search bookings</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID, name or trip" className="h-10 w-full rounded-full border border-border pr-4 pl-10 text-sm outline-none focus:border-pine-600" />
          </label>
          <button type="button" className={adminButton.secondary}><Download className="size-4" /> <span className="hidden sm:inline">Export</span></button>
        </div>
      </div>
      <AdminTable label="Bookings">
        <thead>
          <tr><th>Booking ID</th><th>Customer</th><th>Journey</th><th>Departure</th><th>Pax</th><th>Amount</th><th>Coupon</th><th>Status</th></tr>
        </thead>
        <tbody>
          {filtered.map((b) => (
            <tr key={b.id}>
              <td className="font-mono text-xs">{b.id}<span className="block font-sans text-muted-foreground">{formatDate(b.bookedOn)}</span></td>
              <td><span className="font-medium">{b.customerName}</span><span className="block text-xs text-muted-foreground">{b.customerEmail}</span></td>
              <td>{b.tripName}</td>
              <td className="whitespace-nowrap">{formatDate(b.departureDate)}</td>
              <td>{b.participants}</td>
              <td className="font-semibold whitespace-nowrap">{formatPrice(b.amount)}</td>
              <td className="font-mono text-xs">{b.coupon ?? "—"}</td>
              <td><StatusBadge status={b.status} /></td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
      <div className="flex justify-between border-t border-border px-5 py-3 text-sm">
        <span className="text-muted-foreground">{filtered.length} bookings</span>
        <span>Value <strong>{formatPrice(total)}</strong></span>
      </div>
    </div>
  );
}
