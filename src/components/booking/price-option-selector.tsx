"use client";

import type { PriceOption } from "@/lib/types";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

/** Radio list of a package's price options. Render only when there is more than one. */
export function PriceOptionSelector({
  options,
  value,
  onChange,
  className,
}: {
  options: PriceOption[];
  value: number;
  onChange: (optionId: number) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Price option" className={cn("space-y-2", className)}>
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.id!)}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-2xl border bg-white p-3.5 pl-4 text-left transition-colors",
              selected ? "border-pine-700 ring-2 ring-pine-700/15" : "border-border hover:border-pine-300",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", selected ? "border-pine-700" : "border-ink/25")}
              >
                {selected && <span className="size-2.5 rounded-full bg-pine-700" />}
              </span>
              <span className="truncate font-medium text-ink">{o.label}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-ink">
              {formatPrice(o.price)}
              <span className="font-normal text-muted-foreground">/person</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
