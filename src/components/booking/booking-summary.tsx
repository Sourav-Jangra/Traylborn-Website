import type { PriceBreakdown } from "@/lib/utils/pricing";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export function BookingSummary({ breakdown, className }: { breakdown: PriceBreakdown; className?: string }) {
  const { basePrice, participants, subtotal, discount, total, coupon } = breakdown;

  return (
    <dl className={cn("space-y-2.5 text-sm", className)}>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">
          {formatPrice(basePrice)} × {participants} {participants === 1 ? "traveller" : "travellers"}
        </dt>
        <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
      </div>
      {discount > 0 && coupon && (
        <div className="flex justify-between gap-4 text-moss-600">
          <dt>
            Coupon <span className="font-mono font-semibold">{coupon.code}</span>
            {coupon.type === "percent" && ` (${coupon.value}%)`}
          </dt>
          <dd className="font-medium">−{formatPrice(discount)}</dd>
        </div>
      )}
      <div className="flex items-end justify-between gap-4 border-t border-border pt-3">
        <dt className="font-semibold text-ink">Total payable</dt>
        <dd className="font-display text-2xl font-semibold text-ink">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
