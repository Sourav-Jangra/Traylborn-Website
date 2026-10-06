import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Accent } from "@/components/layout/section-heading";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside className="relative isolate hidden overflow-hidden bg-pine-950 text-white lg:block">
        <Image src="/images/treks/snow-ridge-trekker.jpg" alt="" fill preload sizes="50vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950/90 via-pine-950/30 to-pine-950/40" />
        <div className="flex h-full flex-col justify-between p-12">
          <Logo tone="light" className="self-start" />
          <figure className="max-w-md">
            <blockquote className="font-display text-3xl leading-tight font-semibold">
              &ldquo;I booked alone and came back with eleven friends. <Accent className="text-ember-300">That&apos;s Traylborn.</Accent>&rdquo;
            </blockquote>
            <figcaption className="mt-5 text-sm text-white/70">Parv Gada · Hampta Pass, 2025</figcaption>
          </figure>
        </div>
      </aside>

      <main id="main" className="flex flex-col bg-background">
        <div className="flex items-center justify-between px-5 py-5 sm:px-10 lg:justify-end">
          <Logo className="lg:hidden" />
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-ink">
            Back to site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pt-4 pb-12 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
