"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { whatsappLink } from "@/lib/config/site";
import { cn } from "@/lib/utils";

const HIDDEN_ON = [/^\/packages\//];

/**
 * Floating WhatsApp enquiry button. Hidden on pages with their own sticky
 * booking bar, and on the homepage it waits until the hero is scrolled past
 * so it never covers the hero CTAs on small screens.
 */
export function WhatsappButton() {
  const pathname = usePathname();
  const deferred = pathname === "/";
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  useEffect(() => {
    if (!deferred) return;
    const onScroll = () => setScrolledPastHero(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [deferred]);

  if (HIDDEN_ON.some((r) => r.test(pathname))) return null;
  const visible = !deferred || scrolledPastHero;

  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Traylborn on WhatsApp"
      tabIndex={visible ? undefined : -1}
      className={cn(
        "fixed right-4 bottom-4 z-40 flex h-14 items-center gap-2 rounded-full bg-[#25D366] pr-4 pl-4 text-white shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 sm:right-6 sm:bottom-6 sm:pr-5",
        visible ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <WhatsappIcon className="size-6" />
      <span className="hidden text-sm font-semibold sm:inline">Chat with us</span>
    </a>
  );
}
