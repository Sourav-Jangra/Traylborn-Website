import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { WhatsappIcon } from "@/components/brand/social-icons";
import { ContentLink } from "@/components/content/content-link";
import { RichTitle } from "@/components/content/rich-title";
import type { FinalCtaData } from "@/lib/content/types";
import { whatsappLink } from "@/lib/config/site";
import { getLiveSection } from "@/server/content";

/** The closing banner as managed in the homepage admin, for pages other than the homepage. */
export async function SharedFinalCta() {
  const section = await getLiveSection("home.final_cta");
  if (!section) return null;
  const content = section.data as unknown as FinalCtaData;
  const m = section.media[content.imageId];
  return <FinalCta content={content} image={m?.resourceType === "image" ? { src: m.src, alt: m.alt } : null} />;
}

export function FinalCta({ content, image }: { content: FinalCtaData; image: { src: string; alt: string } | null }) {
  return (
    <section aria-labelledby="final-cta-heading" className="px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-pine-950 px-6 py-24 text-center text-white sm:rounded-[2.5rem] sm:py-32 lg:py-40">
        {image && <Image src={image.src} alt={image.alt} fill sizes="100vw" className="-z-10 object-cover" />}
        <div className="absolute inset-0 -z-10 bg-pine-950/55" />
        {content.eyebrow && (
          <p className="eyebrow justify-center text-ember-300">
            <span className="h-px w-6 bg-ember-300" /> {content.eyebrow}
          </p>
        )}
        <h2 id="final-cta-heading" className="mx-auto mt-5 max-w-4xl text-[2.6rem] leading-[0.98] font-semibold tracking-[-0.03em] sm:text-7xl lg:text-8xl">
          <RichTitle text={content.title} accentClassName="text-ember-300" />
        </h2>
        {content.body && <p className="mx-auto mt-6 max-w-lg text-base text-white/80 sm:text-lg">{content.body}</p>}
        {(content.ctaLabel || content.whatsappLabel) && (
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            {content.ctaLabel && (
              <ContentLink
                href={content.ctaHref}
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ember-500 px-8 font-semibold text-ink transition-colors hover:bg-ember-400"
              >
                {content.ctaLabel}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </ContentLink>
            )}
            {content.whatsappLabel && (
              <a
                href={whatsappLink(content.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-8 font-semibold backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <WhatsappIcon className="size-5" />
                {content.whatsappLabel}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
