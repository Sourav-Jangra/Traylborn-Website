import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  image: string;
  imageAlt: string;
  breadcrumb?: { label: string; href?: string }[];
  children?: ReactNode;
}

export function PageHero({ eyebrow, title, description, image, imageAlt, breadcrumb, children }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-pine-950 text-white">
      <Image src={image} alt={imageAlt} fill preload sizes="100vw" className="-z-10 object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950 via-pine-950/60 to-pine-950/40" />
      <div className="container-page flex min-h-[26rem] flex-col justify-end pt-28 pb-10 sm:min-h-[30rem] sm:pb-14 lg:min-h-[34rem]">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
              {breadcrumb.map((b, i) => (
                <li key={b.label} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-white">{b.label}</Link>
                  ) : (
                    <span aria-current="page" className="text-white">{b.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <p className="eyebrow text-ember-300">
          <span className="h-px w-6 bg-ember-300" /> {eyebrow}
        </p>
        <h1 className="mt-3 max-w-4xl text-[2.6rem] leading-[0.98] font-semibold tracking-[-0.03em] sm:text-6xl lg:text-7xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{description}</p>}
        {children}
      </div>
    </section>
  );
}
