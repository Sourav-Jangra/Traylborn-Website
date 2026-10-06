"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowUpRight, Phone, X } from "lucide-react";
import { m, EASE } from "@/components/ui/motion";
import { LogoMark } from "@/components/brand/logo";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { categories } from "@/lib/config/categories";
import { siteConfig, whatsappLink } from "@/lib/config/site";

const secondary = [
  { label: "Offers", href: "/offers" },
  { label: "Search", href: "/search" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-pine-950 text-white lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="container-page flex h-16 shrink-0 items-center justify-between">
            <Link href="/" onClick={onClose} className="flex items-center gap-2.5" aria-label="Traylborn home">
              <LogoMark className="h-7 text-white" />
              <span className="font-display text-lg font-extrabold tracking-[0.08em]">TRAYLBORN</span>
            </Link>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav aria-label="Mobile" className="container-page flex flex-1 flex-col pt-4 pb-8">
            <p className="eyebrow text-ember-400">Explore</p>
            <ul className="mt-4 space-y-3">
              {categories.map((c, i) => (
                <m.li
                  key={c.slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i + 0.05, duration: 0.45, ease: EASE }}
                >
                  <Link
                    href={c.href}
                    onClick={onClose}
                    className="group relative flex h-20 items-center overflow-hidden rounded-2xl"
                  >
                    <Image src={c.image} alt="" fill sizes="100vw" className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-r from-pine-950/90 via-pine-950/50 to-transparent" />
                    <span className="relative flex w-full items-center justify-between px-5">
                      <span className="font-display text-2xl font-semibold">{c.label}</span>
                      <ArrowUpRight className="size-5 text-ember-400" />
                    </span>
                  </Link>
                </m.li>
              ))}
            </ul>

            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-1">
              {secondary.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={onClose} className="block py-2.5 text-lg text-white/85 hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-auto grid grid-cols-1 gap-3 pt-10">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-13 items-center justify-center gap-2 rounded-full bg-ember-500 font-semibold text-ink"
              >
                <WhatsappIcon className="size-5" /> Chat on WhatsApp
              </a>
              <a
                href={siteConfig.phoneHref}
                className="flex h-13 items-center justify-center gap-2 rounded-full border border-white/20 font-medium"
              >
                <Phone className="size-4" /> {siteConfig.phone}
              </a>
            </div>
          </nav>
        </m.div>
      )}
    </AnimatePresence>
  );
}
