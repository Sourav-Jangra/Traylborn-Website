import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import { AdminCard, AdminHeader, adminButton } from "@/components/admin/admin-ui";
import { BlockListEditor, type BlockView } from "@/components/admin/content/block-list-editor";
import { SectionEditor } from "@/components/admin/content/section-editor";
import { FeaturedEditor, type FeaturedRow } from "@/components/admin/content/featured-editor";
import type { FieldContext } from "@/components/admin/content/content-fields";
import { SECTION_KEYS } from "@/lib/content/schema";
import { requireAdmin } from "@/server/auth/session";
import { listBlocks, listSections, type Block } from "@/server/content";
import { listMedia } from "@/server/media";
import { getAllPackages, getFeaturedPackagesForAdmin, getPublishedPackages } from "@/server/packages";

export const metadata = { title: "Homepage" };

const toView = (b: Block): BlockView => ({ id: b.id, isActive: b.isActive, data: b.data });

export default async function AdminContentPage() {
  await requireAdmin();
  const [hero, promos, sections, media, published, featured, all] = await Promise.all([
    listBlocks("hero"),
    listBlocks("promo"),
    listSections(),
    listMedia(),
    getPublishedPackages(),
    getFeaturedPackagesForAdmin(),
    getAllPackages(),
  ]);

  const ctx: FieldContext = {
    media: media.map((m) => ({ id: m.id, src: m.src, alt: m.alt, label: m.label, resourceType: m.resourceType })),
    packages: published.map((p) => ({ slug: p.slug, title: p.title })),
  };
  const visible = new Set(published.map((p) => p.slug));
  const row = (p: (typeof all)[number]): FeaturedRow => ({ slug: p.slug, title: p.title, status: p.status, visible: visible.has(p.slug) });
  const featuredSlugs = new Set(featured.map((p) => p.slug));

  return (
    <>
      <AdminHeader
        title="Homepage"
        description="Edit what visitors see on the homepage. Changes go live as soon as you save; hidden items stay off the site."
        actions={
          <>
            <Link href="/admin/preview" target="_blank" className={adminButton.secondary}>
              <Eye className="size-4" /> Preview with hidden items
            </Link>
            <Link href="/" target="_blank" className={adminButton.secondary}>
              <ExternalLink className="size-4" /> Live homepage
            </Link>
          </>
        }
      />
      <div className="space-y-6">
        <AdminCard title="Hero slides">
          <p className="px-5 pt-4 text-sm text-muted-foreground">
            The large banner at the top. With more than one visible slide, they rotate every few seconds. At least one slide must stay visible.
          </p>
          <BlockListEditor kind="hero" blocks={hero.map(toView)} ctx={ctx} />
        </AdminCard>

        <AdminCard title="Featured packages">
          <p className="px-5 pt-4 text-sm text-muted-foreground">
            Shown in this order in the &ldquo;Featured journeys&rdquo; section. Only published packages appear on the website.
          </p>
          <FeaturedEditor featured={featured.map(row)} others={all.filter((p) => !featuredSlugs.has(p.slug) && p.status !== "archived").map(row)} />
        </AdminCard>

        <AdminCard title="Promotions and offers">
          <p className="px-5 pt-4 text-sm text-muted-foreground">Banners shown after the featured packages, in this order.</p>
          <BlockListEditor kind="promo" blocks={promos.map(toView)} ctx={ctx} />
        </AdminCard>

        <div>
          <h2 className="mb-3 font-sans text-sm font-semibold">Homepage sections</h2>
          <div className="space-y-3">
            {SECTION_KEYS.map((key) => (
              <SectionEditor key={key} sectionKey={key} initial={sections[key] ? { isActive: sections[key].isActive, data: sections[key].data } : null} ctx={ctx} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
