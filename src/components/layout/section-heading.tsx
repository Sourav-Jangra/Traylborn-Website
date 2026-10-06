import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  action,
  className,
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p className={cn("eyebrow", tone === "light" ? "text-ember-400" : "text-pine-600")}>
            <span className={cn("h-px w-6", tone === "light" ? "bg-ember-400" : "bg-pine-600")} />
            {eyebrow}
          </p>
        )}
        <Heading
          className={cn(
            "mt-3 text-[2rem] leading-[1.05] font-semibold sm:text-4xl lg:text-5xl",
            tone === "light" ? "text-white" : "text-ink",
          )}
        >
          {title}
        </Heading>
        {description && (
          <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", tone === "light" ? "text-white/70" : "text-muted-foreground")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Italic serif accent for a word or two inside display headings. */
export function Accent({ children, className }: { children: ReactNode; className?: string }) {
  return <em className={cn("font-serif font-normal italic tracking-normal", className)}>{children}</em>;
}
