import type { PriceQuote } from "@/lib/utils/pricing";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export function BookingSummary({ quote, showOption, className }: { quote: PriceQuote; showOption: boolean; className?: string }) {
  const { option, travellers, total, plan, payNow, balance } = quote;

  return (
    <dl className={cn("space-y-2.5 text-sm", className)}>
      {showOption && (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Option</dt>
          <dd className="text-right font-medium text-ink">{option.label}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">
          {formatPrice(option.price)} × {travellers} {travellers === 1 ? "traveller" : "travellers"}
        </dt>
        <dd className="font-medium text-ink">{formatPrice(total)}</dd>
      </div>
      <div className="flex items-end justify-between gap-4 border-t border-border pt-3">
        <dt className="font-semibold text-ink">Total</dt>
        <dd className="font-display text-2xl font-semibold text-ink">{formatPrice(total)}</dd>
      </div>
      {plan === "advance" && (
        <>
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-ink">Advance due now</dt>
            <dd className="font-semibold text-ink">{formatPrice(payNow)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Balance later</dt>
            <dd className="font-medium text-ink">{formatPrice(balance)}</dd>
          </div>
        </>
      )}
    </dl>
  );
}
