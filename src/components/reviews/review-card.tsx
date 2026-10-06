import Image from "next/image";
import { Quote, Star } from "lucide-react";
import type { Review } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const avatarTones = ["bg-pine-800", "bg-ember-600", "bg-pine-500", "bg-moss-600"];

export function ReviewCard({ review, className }: { review: Review; className?: string }) {
  const initials = review.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  const tone = avatarTones[review.name.length % avatarTones.length];

  return (
    <figure className={cn("flex h-full flex-col rounded-3xl bg-white p-6 ring-1 ring-black/5 sm:p-7", className)}>
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`} role="img">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn("size-4", i < review.rating ? "fill-ember-500 text-ember-500" : "fill-sand-200 text-sand-200")}
              aria-hidden="true"
            />
          ))}
        </div>
        <Quote className="size-7 text-pine-100" aria-hidden="true" />
      </div>

      <blockquote className="mt-4 flex-1">
        <p className="font-display text-lg leading-snug font-semibold text-ink">“{review.title}”</p>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{review.body}</p>
      </blockquote>

      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white", tone)} aria-hidden="true">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-ink">{review.name}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {review.tripName} · {formatDate(review.date, { day: undefined })}
          </span>
        </span>
        {review.photo && (
          <span className="relative size-11 shrink-0 overflow-hidden rounded-xl">
            <Image src={review.photo} alt={`Photo from ${review.tripName}`} fill sizes="44px" className="object-cover" />
          </span>
        )}
      </figcaption>
    </figure>
  );
}
