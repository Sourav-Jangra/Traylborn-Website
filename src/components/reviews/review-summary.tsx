import { Star } from "lucide-react";

const distribution = [
  { stars: 5, pct: 86 },
  { stars: 4, pct: 11 },
  { stars: 3, pct: 2 },
  { stars: 2, pct: 1 },
  { stars: 1, pct: 0 },
];

export function ReviewSummary({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 ring-1 ring-black/5 sm:flex-row sm:items-center sm:gap-10">
      <div className="shrink-0">
        <p className="font-display text-6xl font-semibold text-ink">{rating.toFixed(1)}</p>
        <div className="mt-1 flex gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="size-4 fill-ember-500 text-ember-500" />
          ))}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{count.toLocaleString("en-IN")} verified reviews</p>
      </div>
      <ul className="flex-1 space-y-2" aria-label="Rating distribution">
        {distribution.map((d) => (
          <li key={d.stars} className="flex items-center gap-3 text-sm">
            <span className="w-8 shrink-0 text-muted-foreground">{d.stars} ★</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand-200">
              <span className="block h-full rounded-full bg-ember-500" style={{ width: `${d.pct}%` }} />
            </span>
            <span className="w-9 shrink-0 text-right text-muted-foreground">{d.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
