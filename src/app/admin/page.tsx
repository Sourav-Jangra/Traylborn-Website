import Link from "next/link";
import { ArrowUpRight, CalendarRange, ExternalLink, Eye, FilePen, Package, Star, Tag } from "lucide-react";
import { AdminCard, AdminHeader, adminButton } from "@/components/admin/admin-ui";
import { getAllPackages } from "@/server/packages";

export const metadata = { title: "Dashboard" };

const capabilities = [
  { title: "Edit trip content", description: "Itinerary, highlights, inclusions and exclusions.", Icon: FilePen },
  { title: "Set prices", description: "Price per person, with an optional struck-through original price.", Icon: Tag },
  { title: "Publish or hide", description: "Keep a trip as a draft until it's ready, then publish it.", Icon: Eye },
  { title: "Feature on homepage", description: "Choose which trips appear in Featured journeys.", Icon: Star },
  { title: "Departure dates", description: "Every day, specific weekdays, or fixed dates.", Icon: CalendarRange },
];

export default async function AdminDashboard() {
  const packages = await getAllPackages();
  const published = packages.filter((p) => p.status === "published");
  const stats = [
    { label: "Published", value: published.length, hint: "Live on the website" },
    { label: "Drafts", value: packages.filter((p) => p.status === "draft").length, hint: "Saved, not visible to customers" },
    { label: "Featured on homepage", value: published.filter((p) => p.featured).length, hint: "Published and marked featured" },
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

      <ul className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <li key={s.label} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-4xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </li>
        ))}
      </ul>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-pine-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="font-semibold">Packages</p>
          <p className="mt-1 text-sm text-white/70">Create and edit trips. Changes are saved to the database and update the website.</p>
        </div>
        <Link href="/admin/packages" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ember-500 px-5 text-sm font-semibold text-ink hover:bg-ember-400">
          Manage packages <ArrowUpRight className="size-4" />
        </Link>
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
