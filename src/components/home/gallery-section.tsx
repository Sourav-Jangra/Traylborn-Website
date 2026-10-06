import { InstagramIcon } from "@/components/brand/social-icons";
import { SectionHeading, Accent } from "@/components/layout/section-heading";
import { Gallery } from "@/components/gallery/gallery";
import { gallery } from "@/lib/mock-data/gallery";
import { siteConfig } from "@/lib/mock-data/site";

export function GallerySection() {
  return (
    <section aria-labelledby="gallery-heading" className="py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Traveller gallery"
          title={
            <span id="gallery-heading">
              Real trips. <Accent className="text-pine-600">Real people.</Accent>
            </span>
          }
          description="Every photo here was taken on a Traylborn departure — no stock skies, no strangers."
          action={
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-pine-800/20 px-6 text-sm font-semibold text-pine-800 transition-colors hover:bg-pine-800 hover:text-white"
            >
              <InstagramIcon className="size-4" /> @traylborn
            </a>
          }
        />
        <Gallery items={gallery} className="mt-12" />
      </div>
    </section>
  );
}
