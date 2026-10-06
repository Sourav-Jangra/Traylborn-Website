"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MobileMenu } from "./mobile-menu";
import { mainNav } from "@/lib/config/site";
import { cn } from "@/lib/utils";

/** Routes that open with a full-bleed dark hero, where the navbar starts transparent. */
const OVERLAY_ROUTES = [/^\/$/, /^\/(treks|road-trips|retreats|offers|about)$/];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const overlay = OVERLAY_ROUTES.some((r) => r.test(pathname));
  const solid = scrolled || !overlay;
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
          solid
            ? "bg-sand-50/90 shadow-[0_1px_0_rgba(15,74,73,0.08)] backdrop-blur-xl"
            : "bg-gradient-to-b from-black/45 to-transparent",
        )}
      >
        <nav aria-label="Main" className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
          <Logo tone={solid ? "dark" : "light"} />

          <ul className="hidden items-center gap-1 lg:flex">
            {mainNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      solid ? "text-ink/75 hover:text-pine-800" : "text-white/85 hover:text-white",
                      active && (solid ? "text-pine-800" : "text-white"),
                    )}
                  >
                    {item.label}
                    {active && (
                      <span className={cn("absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full", solid ? "bg-ember-500" : "bg-ember-400")} />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/search"
              aria-label="Search journeys"
              className={cn(
                "grid size-10 place-items-center rounded-full transition-colors",
                solid ? "text-ink hover:bg-pine-50" : "text-white hover:bg-white/15",
              )}
            >
              <Search className="size-[1.15rem]" />
            </Link>
            <Link
              href="/contact"
              className="ml-1 hidden h-10 items-center rounded-full bg-ember-500 px-5 text-sm font-semibold text-ink transition-colors hover:bg-ember-400 md:inline-flex"
            >
              Plan Your Trip
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className={cn(
                "grid size-10 place-items-center rounded-full transition-colors lg:hidden",
                solid ? "text-ink hover:bg-pine-50" : "text-white hover:bg-white/15",
              )}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </nav>
      </header>
      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
