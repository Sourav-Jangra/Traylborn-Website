import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CategoryMeta } from "@/lib/mock-data/categories";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: CategoryMeta;
  count: number;
  startingFrom?: number;
  index: number;
  className?: string;
}

export function CategoryCard({ category, count, startingFrom, index, className }: CategoryCardProps) {
  return (
    <Link
      href={category.href}
      className={cn(
        "group relative isolate flex h-[26rem] flex-col justify-end overflow-hidden rounded-[2rem] p-6 text-white sm:p-8 lg:h-[36rem]",
        className,
      )}
    >
      <Image
        src={category.image}
        alt={category.imageAlt}
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="-z-10 object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.07]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-950/90 via-pine-950/30 to-transparent transition-opacity duration-500 group-hover:opacity-95" />

      <span className="absolute top-6 left-6 font-display text-sm font-medium text-white/70 sm:top-8 sm:left-8">
        0{index + 1}
      </span>
      <span className="absolute top-5 right-5 grid size-12 place-items-center rounded-full bg-white/15 backdrop-blur-md transition-all duration-500 group-hover:bg-ember-500 group-hover:text-ink sm:top-7 sm:right-7">
        <ArrowUpRight className="size-5 transition-transform duration-500 group-hover:rotate-45" />
      </span>

      <p className="eyebrow text-ember-300">{category.eyebrow}</p>
      <h3 className="mt-2 text-5xl font-semibold tracking-[-0.03em] uppercase sm:text-6xl">{category.label}</h3>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:transition-all lg:duration-500 lg:group-hover:max-h-32 lg:group-hover:opacity-100 lg:group-focus-visible:max-h-32 lg:group-focus-visible:opacity-100">
        {category.headline}. {category.description.split(" — ")[0]}.
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-white/20 pt-4 text-sm">
        <span className="font-semibold">{count === 0 ? "Coming soon" : `${count} ${count === 1 ? "journey" : "journeys"}`}</span>
        {startingFrom !== undefined && (
          <>
            <span className="size-1 rounded-full bg-white/50" />
            <span className="text-white/80">from ₹{startingFrom.toLocaleString("en-IN")}</span>
          </>
        )}
      </div>
    </Link>
  );
}
