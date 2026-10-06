"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Grid2x2 } from "lucide-react";
import type { PackageImage } from "@/lib/types";
import { Lightbox } from "@/components/gallery/lightbox";
import { cn } from "@/lib/utils";

/**
 * Package media: swipeable full-bleed carousel on mobile,
 * editorial mosaic on desktop. Both open the same lightbox.
 */
export function PackageHero({ images, title }: { images: PackageImage[]; title: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = track.current;
    if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <>
      {/* Mobile carousel */}
      <div className="relative mt-16 md:hidden">
        <div ref={track} onScroll={onScroll} className="scrollbar-none flex aspect-[5/4] snap-x snap-mandatory overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setLightbox(i)}
              className="relative h-full w-full shrink-0 snap-center"
              aria-label={`View photo ${i + 1} of ${images.length}`}
            >
              <Image src={img.src} alt={img.alt} fill preload={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden="true">
          {images.map((img, i) => (
            <span key={img.src} className={cn("h-1.5 rounded-full bg-white transition-all", i === slide ? "w-6" : "w-1.5 opacity-60")} />
          ))}
        </div>
        <span className="absolute right-4 bottom-4 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
          {slide + 1}/{images.length}
        </span>
      </div>

      {/* Desktop mosaic */}
      <div className="container-page hidden pt-24 md:block lg:pt-28">
        <div className="relative grid h-[30rem] grid-cols-4 grid-rows-2 gap-3 overflow-hidden rounded-[2rem] lg:h-[34rem]">
          {images.slice(0, 5).map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setLightbox(i)}
              className={cn("group relative overflow-hidden", i === 0 ? "col-span-2 row-span-2" : images.length < 5 && i >= 3 ? "row-span-2" : "")}
              aria-label={`View photo ${i + 1} of ${images.length}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                preload={i === 0}
                sizes={i === 0 ? "50vw" : "25vw"}
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="absolute right-5 bottom-5 flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-ink shadow-lg hover:bg-sand-100"
          >
            <Grid2x2 className="size-4" /> View all {images.length} photos
          </button>
        </div>
      </div>

      <Lightbox
        images={images.map((i) => ({ ...i, caption: title }))}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onIndexChange={setLightbox}
      />
    </>
  );
}
