"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgePercent, ExternalLink, House, Images, LayoutDashboard, LogOut, Menu, Package, Ticket, TicketPercent } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/admin/login/actions";

type SignedInAdmin = { name: string; email: string };

export const adminNav = [
  { label: "Dashboard", href: "/admin", Icon: LayoutDashboard },
  { label: "Packages", href: "/admin/packages", Icon: Package },
  { label: "Bookings", href: "/admin/bookings", Icon: Ticket },
  { label: "Coupons", href: "/admin/coupons", Icon: TicketPercent },
  { label: "Offers", href: "/admin/offers", Icon: BadgePercent },
  { label: "Homepage", href: "/admin/content", Icon: House },
  { label: "Media", href: "/admin/media", Icon: Images },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {adminNav.map(({ label, href, Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/6 hover:text-white",
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarBody({ admin, onNavigate }: { admin: SignedInAdmin; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-pine-950 p-4 text-white">
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5 px-2 py-2">
        <LogoMark className="size-7 text-white" />
        <span className="font-display text-lg font-bold tracking-[0.12em]">TRAYLBORN</span>
      </Link>
      <p className="mt-1 px-2 text-[0.7rem] font-semibold tracking-[0.2em] text-ember-300 uppercase">Admin</p>
      <nav aria-label="Admin" className="mt-6 flex-1">
        <NavList onNavigate={onNavigate} />
      </nav>
      <div className="space-y-3 border-t border-white/10 pt-4">
        <Link href="/" className="flex items-center gap-2 px-3 text-sm text-white/65 hover:text-white">
          <ExternalLink className="size-4" /> View live site
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-white/6 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ember-500 text-sm font-bold text-ink uppercase">
            {admin.name.trim().charAt(0) || "A"}
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-semibold">{admin.name}</span>
            <span className="block truncate text-xs text-white/60">{admin.email}</span>
          </span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="flex w-full items-center gap-2 px-3 text-sm text-white/65 hover:text-white">
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({ admin, children }: { admin: SignedInAdmin; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-svh bg-[#f4f5f3] lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh lg:block">
        <SidebarBody admin={admin} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button type="button" aria-label="Open admin menu" className="grid size-10 place-items-center rounded-full hover:bg-sand-100">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 p-0">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <SidebarBody admin={admin} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-display font-bold tracking-[0.12em] text-pine-800">TRAYLBORN <span className="text-ember-600">ADMIN</span></span>
          <span className="size-10" />
        </header>

        <div className="border-b border-ember-500/20 bg-ember-500/10 px-4 py-2 text-center text-xs font-medium text-ember-700 sm:px-8">
          Changes you save here go live on the website straight away.
        </div>
        <main id="main" className="px-4 py-6 sm:px-8 sm:py-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
