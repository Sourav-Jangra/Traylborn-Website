import type { BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<BookingStatus, string> = {
  Confirmed: "bg-moss-500/12 text-moss-700 ring-moss-500/25",
  "Pending payment": "bg-ember-500/12 text-ember-700 ring-ember-500/30",
  Completed: "bg-pine-800/8 text-pine-800 ring-pine-800/15",
  Cancelled: "bg-destructive/8 text-destructive ring-destructive/20",
};

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset", styles[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}
