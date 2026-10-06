import { cn } from "@/lib/utils";

export const bookingStatusLabel: Record<string, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  expired: "Expired",
  completed: "Completed",
};

const styles: Record<string, string> = {
  pending_payment: "bg-ember-500/15 text-ember-700 ring-ember-500/30",
  confirmed: "bg-moss-500/12 text-moss-700 ring-moss-500/25",
  completed: "bg-pine-800/10 text-pine-800 ring-pine-800/20",
  cancelled: "bg-destructive/8 text-destructive ring-destructive/20",
  expired: "bg-sand-200 text-ink/70 ring-black/5",
};

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", styles[status] ?? styles.expired)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {bookingStatusLabel[status] ?? status}
    </span>
  );
}
