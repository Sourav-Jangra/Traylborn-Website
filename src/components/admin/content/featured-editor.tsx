"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { reorderFeaturedAction } from "@/app/admin/(panel)/content/actions";
import { updatePackageFeatured } from "@/app/admin/(panel)/packages/actions";
import { PublishBadge, adminButton } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

export interface FeaturedRow {
  slug: string;
  title: string;
  status: string;
  /** False when the package is published but has no price options, so the site hides it. */
  visible: boolean;
}

export function FeaturedEditor({ featured, others }: { featured: FeaturedRow[]; others: FeaturedRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError(null);
    start(async () => {
      try {
        const r = await action();
        if (!r.ok) setError(r.error);
        else router.refresh();
      } catch {
        setError("Couldn't save — please try again");
      }
    });
  };

  const move = (i: number, d: -1 | 1) => {
    const slugs = featured.map((f) => f.slug);
    [slugs[i], slugs[i + d]] = [slugs[i + d], slugs[i]];
    run(() => reorderFeaturedAction(slugs));
  };

  return (
    <div className="space-y-3 p-5">
      {error && <p role="alert" className="rounded-xl bg-destructive/8 px-4 py-3 text-sm text-destructive">{error}</p>}
      {featured.length === 0 ? (
        <p className="text-sm text-muted-foreground">No featured packages. The &ldquo;Featured journeys&rdquo; section is hidden until you add one.</p>
      ) : (
        <ol className="divide-y divide-border rounded-2xl ring-1 ring-black/5">
          {featured.map((f, i) => (
            <li key={f.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-5 text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/packages/${f.slug}`} className="font-semibold hover:underline">{f.title}</Link>
                {!f.visible && (
                  <p className="text-xs text-muted-foreground">
                    {f.status === "published" ? "Not shown: add a price option to this package." : "Not shown until the package is published."}
                  </p>
                )}
              </div>
              <PublishBadge status={f.status} />
              <div className="flex gap-1">
                <button type="button" disabled={pending || i === 0} onClick={() => move(i, -1)} className={cn(adminButton.ghost, "disabled:opacity-30")} aria-label={`Move ${f.title} up`}><ArrowUp className="size-3.5" /></button>
                <button type="button" disabled={pending || i === featured.length - 1} onClick={() => move(i, 1)} className={cn(adminButton.ghost, "disabled:opacity-30")} aria-label={`Move ${f.title} down`}><ArrowDown className="size-3.5" /></button>
                <button type="button" disabled={pending} onClick={() => run(() => updatePackageFeatured(f.slug, false))} className={adminButton.ghost} aria-label={`Remove ${f.title} from featured`}>
                  <X className="size-3.5" /> Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="featured-add" className="sr-only">Package to feature</label>
          <select id="featured-add" value={adding} onChange={(e) => setAdding(e.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 text-sm sm:max-w-sm">
            <option value="">Choose a package to feature…</option>
            {others.map((p) => (
              <option key={p.slug} value={p.slug}>{p.title}{p.status !== "published" ? ` (${p.status})` : ""}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!adding || pending}
            onClick={() => {
              const slug = adding;
              setAdding("");
              run(() => updatePackageFeatured(slug, true));
            }}
            className={cn(adminButton.secondary, "disabled:opacity-50")}
          >
            <Plus className="size-4" /> Add to featured
          </button>
        </div>
      )}
    </div>
  );
}
