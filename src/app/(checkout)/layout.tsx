import Link from "next/link";
import { Lock, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/lib/mock-data/site";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-sand-50">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden items-center gap-1.5 font-medium text-moss-600 sm:flex">
              <Lock className="size-4" aria-hidden="true" /> Secure checkout
            </span>
            <a href={siteConfig.phoneHref} className="flex items-center gap-1.5 font-medium text-ink/80 hover:text-ink">
              <Phone className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Need help?</span> {siteConfig.phone}
            </a>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Traylborn ·{" "}
        <Link href="/about" className="underline-offset-4 hover:underline">Terms</Link> ·{" "}
        <Link href="/about" className="underline-offset-4 hover:underline">Cancellation policy</Link>
      </footer>
    </div>
  );
}
