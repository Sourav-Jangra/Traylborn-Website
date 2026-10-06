"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps {
  label: string;
  header?: ReactNode;
  children: ReactNode;
}

/** Horizontal snap scroller: swipe on touch devices, arrow buttons on desktop. */
export function Carousel({ label, header, children }: CarouselProps) {
  const track = useRef<HTMLUListElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const item = el.querySelector("li");
    const step = item ? item.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0 flex-1">{header}</div>
        <div className="hidden shrink-0 gap-2 md:flex">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => scroll(dir)}
              aria-label={dir === -1 ? "Previous" : "Next"}
              className="grid size-12 place-items-center rounded-full border border-pine-800/15 bg-white text-pine-800 transition-colors hover:bg-pine-800 hover:text-white"
            >
              {dir === -1 ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
            </button>
          ))}
        </div>
      </div>
      <ul
        ref={track}
        aria-label={label}
        className="scrollbar-none -mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pt-2 pb-8 sm:-mx-8 sm:mt-10 sm:gap-6 sm:scroll-px-8 sm:px-8 lg:-mx-12 lg:scroll-px-12 lg:px-12"
      >
        {children}
      </ul>
    </div>
  );
}

export function CarouselItem({ children }: { children: ReactNode }) {
  return <li className="w-[82vw] max-w-[22rem] shrink-0 snap-start sm:w-[22rem]">{children}</li>;
}
