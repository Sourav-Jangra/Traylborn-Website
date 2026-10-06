import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { Accent } from "@/components/layout/section-heading";
import { whatsappLink } from "@/lib/config/site";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-pine-950 px-6 py-24 text-center text-white sm:rounded-[2.5rem] sm:py-32 lg:py-40">
        <Image
          src="/images/treks/sunrise-silhouette.jpg"
          alt="A trekker silhouetted above a sea of clouds at sunrise"
          fill
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-pine-950/55" />
        <p className="eyebrow justify-center text-ember-300">
          <span className="h-px w-6 bg-ember-300" /> Ready when you are
        </p>
        <h2 id="final-cta-heading" className="mx-auto mt-5 max-w-4xl text-[2.6rem] leading-[0.98] font-semibold tracking-[-0.03em] sm:text-7xl lg:text-8xl">
          Your next story <Accent className="text-ember-300">starts here.</Accent>
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-base text-white/80 sm:text-lg">
          Pick a journey, choose your dates, and we&apos;ll handle everything else — from packing lists to the last summit photo.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/treks"
            className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ember-500 px-8 font-semibold text-ink transition-colors hover:bg-ember-400"
          >
            Explore Journeys
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href={whatsappLink("Hi Traylborn! I'd like help planning a trip.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-8 font-semibold backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <WhatsappIcon className="size-5" />
            Talk to Traylborn
          </a>
        </div>
      </div>
    </section>
  );
}
