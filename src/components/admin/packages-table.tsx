"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Search, Star } from "lucide-react";
import { updatePackageFeatured, updatePackageStatus, type SaveResult } from "@/app/admin/(panel)/packages/actions";
import type { Category, PackageStatus } from "@/lib/types";
import { categories, categoryMeta } from "@/lib/config/categories";
import { formatPrice } from "@/lib/utils/format";
import { AdminTable, PublishBadge, adminButton } from "./admin-ui";
import { cn } from "@/lib/utils";

export interface PackageRow {
  id: string;
  slug: string;
  title: string;
  image: string;
  category: Category;
  region: string;
  /** Lowest option price. */
  price: number;
  priceOptionCount: number;
  durationDays: number;
  nights: number;
  departureLabel: string;
  featured: boolean;
  status: PackageStatus;
  rating: number;
}

export function PackagesTable({ rows: initial }: { rows: PackageRow[] }) {
  const [rows, setRows] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (category === "all" || r.category === category) &&
          `${r.title} ${r.region}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [rows, query, category],
  );

  const persist = (row: PackageRow, patch: Partial<PackageRow>, action: () => Promise<SaveResult>) => {
    setError(null);
    setPending(row.id);
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    startTransition(async () => {
      let result: SaveResult;
      try {
        result = await action();
      } catch {
        result = { ok: false, error: "Couldn't save — please try again" };
      }
      if (!result.ok) {
        setRows((rs) => rs.map((r) => (r.id === row.id ? row : r)));
        setError(`${row.title}: ${result.error}`);
      }
      setPending(null);
    });
  };

  const toggleStatus = (row: PackageRow) => {
    const status: PackageStatus = row.status === "published" ? "draft" : "published";
    persist(row, { status }, () => updatePackageStatus(row.slug, status));
  };
  const toggleFeatured = (row: PackageRow) =>
    persist(row, { featured: !row.featured }, () => updatePackageFeatured(row.slug, !row.featured));

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-none flex gap-1 overflow-x-auto">
          {[{ slug: "all" as const, label: "All" }, ...categories].map((c) => (
            <button
              key={c.slug}
              type="button"
              aria-pressed={category === c.slug}
              onClick={() => setCategory(c.slug)}
              className={cn("h-9 shrink-0 rounded-full px-4 text-sm font-medium", category === c.slug ? "bg-pine-800 text-white" : "text-ink/70 hover:bg-sand-100")}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="relative sm:w-64">
          <span className="sr-only">Search packages</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search packages" className="h-10 w-full rounded-full border border-border pr-4 pl-10 text-sm outline-none focus:border-pine-600" />
        </label>
      </div>

      {error && <p role="alert" className="border-b border-border bg-destructive/8 px-5 py-3 text-sm text-destructive">{error}</p>}

      <AdminTable label="Packages">
        <thead>
          <tr><th>Package</th><th>Price</th><th>Departures</th><th>Featured</th><th>Status</th><th className="text-right">Actions</th></tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td>
                <div className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                    <Image src={r.image} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{categoryMeta[r.category].singular} · {r.region} · {r.durationDays}D/{r.nights}N</p>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap">
                {r.priceOptionCount === 0 ? (
                  <span className="text-destructive">No price</span>
                ) : (
                  <>
                    {r.priceOptionCount > 1 && <span className="text-xs text-muted-foreground">From </span>}
                    <span className="font-semibold">{formatPrice(r.price)}</span>
                    {r.priceOptionCount > 1 && <span className="block text-xs text-muted-foreground">{r.priceOptionCount} options</span>}
                  </>
                )}
              </td>
              <td className="text-muted-foreground">{r.departureLabel}</td>
              <td>
                <button type="button" onClick={() => toggleFeatured(r)} disabled={pending === r.id} aria-pressed={r.featured} aria-label={`${r.featured ? "Unfeature" : "Feature"} ${r.title}`} className="grid size-8 place-items-center rounded-lg hover:bg-sand-100">
                  <Star className={cn("size-4", r.featured ? "fill-ember-500 text-ember-500" : "text-ink/30")} />
                </button>
              </td>
              <td><PublishBadge status={r.status} /></td>
              <td>
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/packages/${r.slug}`} className={adminButton.ghost}><Pencil className="size-3.5" /> Edit</Link>
                  {r.status === "published" ? (
                    <Link href={`/packages/${r.slug}`} target="_blank" className={adminButton.ghost}><Eye className="size-3.5" /> Preview</Link>
                  ) : (
                    <span title="Preview unavailable until published" className={cn(adminButton.ghost, "cursor-not-allowed text-ink/40 hover:bg-transparent hover:text-ink/40")}>
                      <EyeOff className="size-3.5" /> Not published
                    </span>
                  )}
                  <button type="button" onClick={() => toggleStatus(r)} disabled={pending === r.id} className={cn(adminButton.ghost, "disabled:opacity-50", r.status === "published" ? "text-destructive hover:text-destructive" : "text-moss-700")}>
                    {r.status === "published" ? <><EyeOff className="size-3.5" /> Unpublish</> : <><Eye className="size-3.5" /> Publish</>}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
      {filtered.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No packages match.</p>}
    </div>
  );
}
