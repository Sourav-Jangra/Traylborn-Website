import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { Offer } from "@/lib/mock-data/offers";
import { formatDate } from "@/lib/utils/format";
import { CopyCode } from "./copy-code";
import { cn } from "@/lib/utils";

interface OfferBannerProps {
  offer: Offer;
  variant?: "hero" | "compact";
  className?: string;
}

export function OfferBanner({ offer, variant = "hero", className }: OfferBannerProps) {
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[2rem] bg-pine-950 text-white",
        compact ? "p-6 sm:p-8" : "p-7 sm:p-12 lg:p-16",
        className,
      )}
    >
      <Image
        src={offer.image}
        alt={offer.imageAlt}
        fill
        sizes={compact ? "(min-width: 1024px) 50vw, 100vw" : "100vw"}
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950/95 via-pine-950/80 to-pine-950/50 sm:bg-gradient-to-r sm:from-pine-950/95 sm:via-pine-950/75 sm:to-pine-950/20" />

      <div className={cn("max-w-xl", !compact && "lg:max-w-2xl")}>
        <p className="eyebrow text-ember-300">
          <span className="h-px w-6 bg-ember-300" /> {offer.eyebrow}
        </p>
        <p
          className={cn(
            "mt-4 font-display leading-[0.9] font-semibold tracking-[-0.03em] text-ember-400",
            compact ? "text-4xl sm:text-5xl" : "text-6xl sm:text-7xl lg:text-8xl",
          )}
        >
          {offer.highlight}
        </p>
        <h3 className={cn("mt-3 font-semibold", compact ? "text-xl" : "text-2xl sm:text-3xl")}>{offer.title}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">{offer.description}</p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <CopyCode code={offer.code} className="text-ember-300" />
          <Link
            href={offer.href}
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-ink transition-colors hover:bg-ember-400"
          >
            Browse journeys
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <p className="mt-5 flex items-center gap-1.5 text-xs text-white/60">
          <Clock className="size-3.5" /> Valid till {formatDate(offer.validTill)} · Apply at checkout
        </p>
      </div>
    </div>
  );
}
