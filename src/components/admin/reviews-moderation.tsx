"use client";

import { useState } from "react";
import { Check, EyeOff, Pin, Star } from "lucide-react";
import type { Review } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";
import { adminButton } from "./admin-ui";
import { cn } from "@/lib/utils";

type State = "published" | "pending" | "hidden";

export function ReviewsModeration({ reviews }: { reviews: Review[] }) {
  const [state, setState] = useState<Record<string, State>>(() =>
    Object.fromEntries(reviews.map((r, i) => [r.id, i >= reviews.length - 2 ? "pending" : "published"])),
  );
  const [pinned, setPinned] = useState<string[]>(reviews.slice(0, 3).map((r) => r.id));
  const [filter, setFilter] = useState<State | "all">("all");
  const list = reviews.filter((r) => filter === "all" || state[r.id] === filter);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1">
        {(["all", "pending", "published", "hidden"] as const).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("h-9 rounded-full px-4 text-sm font-medium capitalize", filter === f ? "bg-pine-800 text-white" : "bg-white text-ink/70 ring-1 ring-black/5 hover:bg-sand-50")}>
            {f} <span className="opacity-60">{f === "all" ? reviews.length : Object.values(state).filter((s) => s === f).length}</span>
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {list.map((r) => (
          <li key={r.id} className={cn("rounded-2xl bg-white p-5 ring-1 ring-black/5", state[r.id] === "hidden" && "opacity-60")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.name} <span className="font-normal text-muted-foreground">· {r.city}</span></p>
                <p className="text-xs text-muted-foreground">{r.tripName} · {formatDate(r.date)}</p>
              </div>
              <span className="flex shrink-0 items-center gap-0.5" aria-label={`${r.rating} stars`}>
                {Array.from({ length: 5 }, (_, i) => <Star key={i} className={cn("size-3.5", i < r.rating ? "fill-ember-500 text-ember-500" : "text-sand-300")} aria-hidden="true" />)}
              </span>
            </div>
            <p className="mt-3 font-medium">{r.title}</p>
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{r.body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-border pt-3">
              <span className={cn("mr-auto rounded-full px-2.5 py-1 text-xs font-semibold capitalize", state[r.id] === "published" && "bg-moss-500/12 text-moss-700", state[r.id] === "pending" && "bg-ember-500/12 text-ember-700", state[r.id] === "hidden" && "bg-sand-200 text-ink/60")}>
                {state[r.id]}
              </span>
              {state[r.id] !== "published" && (
                <button type="button" onClick={() => setState((s) => ({ ...s, [r.id]: "published" }))} className={cn(adminButton.ghost, "text-moss-700")}><Check className="size-3.5" /> Approve</button>
              )}
              {state[r.id] !== "hidden" && (
                <button type="button" onClick={() => setState((s) => ({ ...s, [r.id]: "hidden" }))} className={adminButton.ghost}><EyeOff className="size-3.5" /> Hide</button>
              )}
              <button type="button" aria-pressed={pinned.includes(r.id)} onClick={() => setPinned((p) => (p.includes(r.id) ? p.filter((x) => x !== r.id) : [...p, r.id]))} className={cn(adminButton.ghost, pinned.includes(r.id) && "text-ember-700")}>
                <Pin className={cn("size-3.5", pinned.includes(r.id) && "fill-current")} /> {pinned.includes(r.id) ? "On homepage" : "Pin to homepage"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
