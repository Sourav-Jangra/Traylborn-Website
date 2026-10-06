"use client";

import Image from "next/image";
import { useState } from "react";
import { Expand } from "lucide-react";
import type { GalleryItem } from "@/lib/types";
import { Lightbox } from "./lightbox";
import { cn } from "@/lib/utils";

const spanClass = {
  tall: "row-span-2",
  wide: "sm:col-span-2",
  normal: "",
};

export function Gallery({ items, className }: { items: GalleryItem[]; className?: string }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <ul className={cn("grid grid-flow-row-dense auto-rows-[9.5rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] sm:gap-4 lg:grid-cols-4 lg:auto-rows-[14rem]", className)}>
        {items.map((item, i) => (
          <li key={item.src + i} className={cn("relative", spanClass[item.span ?? "normal"])}>
            <button
              type="button"
              onClick={() => setActive(i)}
              className="group relative block h-full w-full overflow-hidden rounded-2xl sm:rounded-3xl"
              aria-label={`Open photo: ${item.caption}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
              <span className="absolute inset-x-4 bottom-3 flex items-center justify-between text-left text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                {item.caption}
                <Expand className="size-4" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Lightbox images={items} index={active} onClose={() => setActive(null)} onIndexChange={setActive} />
    </>
  );
}
