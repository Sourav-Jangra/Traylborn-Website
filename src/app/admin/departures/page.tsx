import Link from "next/link";
import { AdminCard, AdminHeader, AdminTable } from "@/components/admin/admin-ui";
import { packages } from "@/lib/mock-data/packages";
import { getDepartures, MAX_PARTICIPANTS } from "@/lib/utils/departures";
import { sampleSeatsBooked } from "@/lib/mock-data/sample-seats";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Departures" };

export default function AdminDeparturesPage() {
  const rows = packages
    .flatMap((p) => getDepartures(p, 3).map((d) => ({ pkg: p, dep: d })))
    .sort((a, b) => a.dep.date.localeCompare(b.dep.date))
    .slice(0, 24);

  return (
    <>
      <AdminHeader title="Departures" description="Upcoming batches generated from each package's departure rule." />
      <AdminCard>
        <div className="-m-5">
          <AdminTable label="Departures">
            <thead>
              <tr><th>Date</th><th>Journey</th><th>Rule</th><th>Seats booked</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {rows.map(({ pkg, dep }) => {
                const booked = sampleSeatsBooked(pkg.slug, dep.date);
                const status = booked === MAX_PARTICIPANTS ? "soldout" : booked >= MAX_PARTICIPANTS - 5 ? "filling" : "available";
                return (
                  <tr key={pkg.id + dep.date}>
                    <td className="font-medium whitespace-nowrap">{formatDate(dep.date, { weekday: "short" })}</td>
                    <td>{pkg.title}</td>
                    <td className="text-muted-foreground">{pkg.departureLabel}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-sand-200">
                          <div className={cn("h-full rounded-full", status === "available" ? "bg-moss-500" : "bg-ember-500")} style={{ width: `${(booked / MAX_PARTICIPANTS) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{booked}/{MAX_PARTICIPANTS}</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", status === "available" && "bg-moss-500/12 text-moss-700", status === "filling" && "bg-ember-500/12 text-ember-700", status === "soldout" && "bg-destructive/8 text-destructive")}>
                        {status === "soldout" ? "Sold out" : status === "filling" ? "Filling fast" : "Open"}
                      </span>
                    </td>
                    <td><Link href={`/admin/packages/${pkg.slug}`} className="text-xs font-semibold text-pine-700 hover:underline">Edit rule</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTable>
        </div>
      </AdminCard>
    </>
  );
}
