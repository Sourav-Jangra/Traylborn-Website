import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarRange, ExternalLink, Eye, FilePen, Package, Star, Tag } from "lucide-react";
import { AdminCard, AdminHeader, adminButton } from "@/components/admin/admin-ui";
import { getDepartures, todayISO } from "@/lib/utils/departures";
import { addDays, formatDate } from "@/lib/utils/format";
import { requireAdmin } from "@/server/auth/session";
import { getAllPackages } from "@/server/packages";

export const metadata = { title: "Dashboard" };

const UPCOMING_WINDOW_DAYS = 30;

const capabilities = [
  { title: "Edit trip content", description: "Itinerary, highlights, inclusions and exclusions.", Icon: FilePen },
  { title: "Set prices", description: "Price per person, with an optional struck-through original price.", Icon: Tag },
  { title: "Publish or hide", description: "Keep a trip as a draft until it's ready, then publish it.", Icon: Eye },
  { title: "Feature on homepage", description: "Choose which trips appear in Featured journeys.", Icon: Star },
  { title: "Departure dates", description: "Every day, specific weekdays, or fixed dates.", Icon: CalendarRange },
];

export default async function AdminDashboard() {
  await requireAdmin();
  const packages = await getAllPackages();
  const published = packages.filter((p) => p.status === "published");

  const today = todayISO();
  const windowEnd = addDays(today, UPCOMING_WINDOW_DAYS - 1);
  const departures = published
    .flatMap((p) =>
      getDepartures(p, 400, today)
        .filter((d) => d.date <= windowEnd)
        .map((d) => ({ date: d.date, slug: p.slug, title: p.title })),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  const withoutDates = published.filter((p) => getDepartures(p, 1, today).length === 0);

  const stats = [
    { label: "Published", value: published.length, hint: "Live on the website" },
    { label: "Drafts", value: packages.filter((p) => p.status === "draft").length, hint: "Saved, not visible to customers" },
    { label: "Featured on homepage", value: published.filter((p) => p.featured).length, hint: "Published and marked featured" },
    {
      label: `Departures in next ${UPCOMING_WINDOW_DAYS} days`,
      value: departures.length,
      hint: "Bookable dates across published packages",
    },
  ];

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description={`${packages.length} ${packages.length === 1 ? "package" : "packages"} in the database`}
        actions={
          <>
            <Link href="/" target="_blank" className={adminButton.secondary}><ExternalLink className="size-4" /> View live site</Link>
            <Link href="/admin/packages" className={adminButton.primary}><Package className="size-4" /> Manage packages</Link>
          </>
        }
      />

      <ul className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-4xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </li>
        ))}
      </ul>

      {withoutDates.length > 0 && (
        <div className="mb-6 flex gap-3 rounded-2xl bg-ember-500/10 p-4 text-sm text-ember-700 ring-1 ring-ember-500/25">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            {withoutDates.length === 1 ? "This published package has" : "These published packages have"} no upcoming
            departure dates, so customers can&apos;t pick a date:{" "}
            {withoutDates.map((p, i) => (
              <span key={p.slug}>
                {i > 0 && ", "}
                <Link href={`/admin/packages/${p.slug}`} className="font-semibold underline underline-offset-2">{p.title}</Link>
              </span>
            ))}
          </p>
        </div>
      )}

      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <AdminCard title="Upcoming departures">
          {departures.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No departures in the next {UPCOMING_WINDOW_DAYS} days.</p>
          ) : (
            <ul className="divide-y divide-border">
              {departures.slice(0, 8).map((d) => (
                <li key={`${d.slug}-${d.date}`} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <Link href={`/admin/packages/${d.slug}`} className="min-w-0 truncate font-medium hover:underline">{d.title}</Link>
                  <span className="shrink-0 text-muted-foreground">{formatDate(d.date)}</span>
                </li>
              ))}
              {departures.length > 8 && (
                <li className="px-5 py-3 text-xs text-muted-foreground">
                  and {departures.length - 8} more in the next {UPCOMING_WINDOW_DAYS} days
                </li>
              )}
            </ul>
          )}
        </AdminCard>

        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-pine-950 p-5 text-white sm:p-6">
          <div>
            <p className="font-semibold">Packages</p>
            <p className="mt-1 text-sm text-white/70">Create and edit trips. Changes are saved to the database and update the website.</p>
          </div>
          <Link href="/admin/packages" className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full bg-ember-500 px-5 text-sm font-semibold text-ink hover:bg-ember-400">
            Manage packages <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>

      <AdminCard title="What you can manage">
        <ul className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {capabilities.map(({ title, description, Icon }) => (
            <li key={title} className="flex gap-3 rounded-xl bg-sand-50 p-4 ring-1 ring-black/5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-pine-700 ring-1 ring-black/5">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </AdminCard>
    </>
  );
}
