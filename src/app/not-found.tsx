import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Accent } from "@/components/layout/section-heading";

export default function NotFound() {
  return (
    <main id="main" className="relative isolate flex min-h-svh flex-col bg-pine-950 text-white">
      <Image src="/images/treks/misty-valley.jpg" alt="" fill preload sizes="100vw" className="-z-10 object-cover opacity-50" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950 via-pine-950/70 to-pine-950/30" />
      <div className="container-page py-6">
        <Logo tone="light" />
      </div>
      <div className="container-page flex flex-1 flex-col justify-center pb-20">
        <p className="font-display text-sm font-semibold tracking-[0.3em] text-ember-300">ERROR 404</p>
        <h1 className="mt-4 max-w-2xl text-5xl leading-[0.95] font-semibold sm:text-7xl">
          This trail <Accent className="text-ember-300">doesn&apos;t exist.</Accent>
        </h1>
        <p className="mt-5 max-w-md text-lg text-white/75">The page may have moved, or the link might be off the map. Let&apos;s get you back to base camp.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex h-13 items-center justify-center rounded-full bg-ember-500 px-7 font-semibold text-ink hover:bg-ember-400">Back to home</Link>
          <Link href="/search" className="inline-flex h-13 items-center justify-center rounded-full border border-white/30 px-7 font-semibold hover:bg-white/10">Search journeys</Link>
        </div>
      </div>
    </main>
  );
}
