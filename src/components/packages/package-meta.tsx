import { Star } from "lucide-react";
import type { Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  className,
  tone = "dark",
}: {
  value: number;
  count?: number;
  className?: string;
  tone?: "dark" | "light";
}) {
  if (count === 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", className)}>
      <Star className="size-3.5 fill-ember-500 text-ember-500" aria-hidden="true" />
      <span>{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className={cn("font-normal", tone === "light" ? "text-white/70" : "text-muted-foreground")}>
          ({count.toLocaleString("en-IN")})
        </span>
      )}
      <span className="sr-only"> out of 5 stars</span>
    </span>
  );
}

const difficultyStyles: Record<Difficulty, string> = {
  Easy: "bg-moss-500/15 text-moss-600",
  Moderate: "bg-ember-500/15 text-ember-600",
  Challenging: "bg-red-500/10 text-red-700",
};

export function DifficultyBadge({ level, className }: { level: Difficulty; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", difficultyStyles[level], className)}>
      {level}
    </span>
  );
}
