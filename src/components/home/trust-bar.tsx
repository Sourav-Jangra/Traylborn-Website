import { ContentIcon } from "@/lib/content/icons";
import type { TrustBarData } from "@/lib/content/types";

export function TrustBar({ items }: TrustBarData) {
  if (!items.length) return null;
  return (
    <div className="border-b border-border bg-white">
      <ul className="container-page scrollbar-none flex gap-8 overflow-x-auto py-5 lg:justify-between">
        {items.map(({ icon, label }, i) => (
          <li key={i} className="flex shrink-0 items-center gap-2.5 text-sm font-medium text-ink/80">
            <ContentIcon name={icon} className="size-5 text-pine-600" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
