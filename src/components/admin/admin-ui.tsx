import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AdminCard({ title, action, children, className, bodyClassName }: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-2xl bg-white ring-1 ring-black/5", className)}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="font-sans text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className={cn(title ? "" : "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Horizontally scrollable table wrapper so wide admin tables never overflow the page on mobile. */
export function AdminTable({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
      <table className="w-full min-w-[40rem] text-left text-sm [&_td]:px-5 [&_td]:py-3.5 [&_th]:px-5 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:tracking-wider [&_th]:text-muted-foreground [&_th]:uppercase [&_thead]:bg-sand-50 [&_tbody_tr]:border-t [&_tbody_tr]:border-border [&_tbody_tr:hover]:bg-sand-50/60">
        {children}
      </table>
    </div>
  );
}

export const adminButton = {
  primary: "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-pine-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-pine-700",
  secondary: "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold transition-colors hover:bg-sand-50",
  ghost: "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-ink/70 transition-colors hover:bg-sand-100 hover:text-ink",
};

export function PublishBadge({ status }: { status: "published" | "draft" | "archived" | string }) {
  const map: Record<string, string> = {
    published: "bg-moss-500/12 text-moss-700 ring-moss-500/25",
    draft: "bg-sand-200 text-ink/70 ring-black/5",
    archived: "bg-destructive/8 text-destructive ring-destructive/20",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset", map[status] ?? map.draft)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}
