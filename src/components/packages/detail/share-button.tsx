"use client";

import { useState } from "react";
import { Check, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${title} · Traylborn`, url }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex shrink-0 gap-2 pt-1">
      <button
        type="button"
        onClick={() => setSaved((s) => !s)}
        aria-pressed={saved}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        className="grid size-11 place-items-center rounded-full border border-border bg-white transition-colors hover:border-pine-400"
      >
        <Heart className={cn("size-5 transition-colors", saved ? "fill-red-500 text-red-500" : "text-ink")} />
      </button>
      <button
        type="button"
        onClick={share}
        aria-label="Share this journey"
        className="grid size-11 place-items-center rounded-full border border-border bg-white transition-colors hover:border-pine-400"
      >
        {copied ? <Check className="size-5 text-moss-600" /> : <Share2 className="size-5 text-ink" />}
      </button>
    </div>
  );
}
