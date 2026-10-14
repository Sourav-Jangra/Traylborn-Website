import Image from "next/image";
import { RichTitle } from "@/components/content/rich-title";
import { Reveal } from "@/components/ui/motion";
import { ContentIcon } from "@/lib/content/icons";
import type { WhyData } from "@/lib/content/types";

export function WhyTraylborn({ content, image }: { content: WhyData; image: { src: string; alt: string } | null }) {
  return (
    <section aria-labelledby="why-heading" className="relative overflow-hidden bg-pine-950 py-20 text-white sm:py-28">
      <div className="container-page grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          {content.eyebrow && (
            <p className="eyebrow text-ember-400">
              <span className="h-px w-6 bg-ember-400" /> {content.eyebrow}
            </p>
          )}
          <h2 id="why-heading" className="mt-3 text-[2rem] leading-[1.05] font-semibold sm:text-5xl">
            <RichTitle text={content.title} accentClassName="text-ember-300" />
          </h2>
          {content.description && (
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">{content.description}</p>
          )}

          {image && (
            <Reveal className="relative mt-10 hidden aspect-[4/5] max-w-md overflow-hidden rounded-[2rem] lg:block">
              <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 30vw, 0px" className="object-cover" />
            </Reveal>
          )}
        </div>

        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {content.pillars.map(({ icon, title, body }, i) => (
              <Reveal key={i} delay={i * 0.08} className="h-full">
                <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.07] sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-ember-500 text-ink">
                      <ContentIcon name={icon} className="size-5" />
                    </span>
                    <span className="font-display text-sm text-white/40">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-white/65">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
