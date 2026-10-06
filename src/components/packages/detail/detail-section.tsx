import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DetailSection({
  id,
  title,
  eyebrow,
  children,
  className,
}: {
  id: string;
  title: ReactNode;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-32 border-t border-border py-12 sm:py-14", className)}>
      {eyebrow && <p className="eyebrow text-pine-600">{eyebrow}</p>}
      <h2 id={`${id}-title`} className="mt-2 text-2xl font-semibold sm:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
