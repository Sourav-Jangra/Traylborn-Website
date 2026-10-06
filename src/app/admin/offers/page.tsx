import Image from "next/image";
import { Pencil, Plus } from "lucide-react";
import { AdminHeader, PublishBadge, adminButton } from "@/components/admin/admin-ui";
import { offers } from "@/lib/mock-data/offers";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Offers" };

export default function AdminOffersPage() {
  return (
    <>
      <AdminHeader
        title="Offers"
        description="Seasonal banners shown on the homepage, offers page and category pages."
        actions={<button type="button" className={adminButton.primary}><Plus className="size-4" /> New offer</button>}
      />
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {offers.map((o, i) => (
          <li key={o.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
            <div className="relative h-40">
              <Image src={o.image} alt={o.imageAlt} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-pine-950/85 to-transparent" />
              <div className="absolute inset-x-4 bottom-3 text-white">
                <p className="font-display text-2xl font-semibold text-ember-400">{o.highlight}</p>
                <p className="text-sm font-medium">{o.title}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0 text-sm">
                <p className="font-mono text-xs font-bold text-pine-800">{o.code}</p>
                <p className="text-xs text-muted-foreground">Until {formatDate(o.validTill)}{i === 0 && " · Homepage hero"}</p>
              </div>
              <div className="flex items-center gap-2">
                <PublishBadge status="published" />
                <button type="button" className={adminButton.ghost} aria-label={`Edit ${o.title}`}><Pencil className="size-3.5" /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
