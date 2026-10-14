import { AdminHeader } from "@/components/admin/admin-ui";
import { MediaLibrary, type LibraryItem } from "@/components/admin/media-library";
import { requireAdmin } from "@/server/auth/session";
import { cloudinaryCloudName, getMediaUsage, listMedia, listUnregisteredSiteImages } from "@/server/media";

export const metadata = { title: "Media" };

export default async function AdminMediaPage() {
  await requireAdmin();
  const [media, usage, unregistered] = await Promise.all([listMedia(), getMediaUsage(), listUnregisteredSiteImages()]);
  const items: LibraryItem[] = media.map((m) => ({
    id: m.id,
    src: m.src,
    alt: m.alt,
    label: m.label,
    resourceType: m.resourceType,
    provider: m.provider,
    uses: usage.get(m.id) ?? [],
  }));

  return (
    <>
      <AdminHeader title="Media" description="Images and videos you can use on the homepage and in packages." />
      <MediaLibrary items={items} unregistered={unregistered} cloudName={cloudinaryCloudName()} />
    </>
  );
}
