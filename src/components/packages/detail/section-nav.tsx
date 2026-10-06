"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "about", label: "Overview" },
  { id: "itinerary", label: "Itinerary" },
  { id: "dates", label: "Dates" },
  { id: "inclusions", label: "Inclusions" },
  { id: "gallery", label: "Gallery" },
  { id: "faq", label: "FAQ" },
];

/** Sticky in-page navigation with scroll-spy. */
export function SectionNav({ showFaq = true }: { showFaq?: boolean }) {
  const [active, setActive] = useState("about");
  const visibleSections = showFaq ? sections : sections.filter((s) => s.id !== "faq");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Journey sections" className="sticky top-16 z-30 -mx-5 mt-8 border-b border-border bg-background/95 backdrop-blur-md sm:-mx-8 lg:top-20 lg:mx-0">
      <ul className="scrollbar-none flex gap-1 overflow-x-auto px-5 sm:px-8 lg:px-0">
        {visibleSections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "true" : undefined}
              className={cn(
                "relative inline-flex h-12 items-center px-3 text-sm font-medium whitespace-nowrap transition-colors",
                active === s.id ? "text-pine-800" : "text-muted-foreground hover:text-ink",
              )}
            >
              {s.label}
              {active === s.id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-pine-800" />}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
