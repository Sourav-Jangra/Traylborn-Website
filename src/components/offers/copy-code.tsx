"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyCode({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard may be unavailable (e.g. insecure context) — still show feedback */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex h-12 items-center gap-3 rounded-full border-2 border-dashed border-current/40 pr-2 pl-5 font-mono text-sm font-semibold tracking-widest transition-colors",
        className,
      )}
      aria-label={`Copy coupon code ${code}`}
    >
      {code}
      <span className="flex h-8 items-center gap-1.5 rounded-full bg-current/15 px-3 font-sans text-xs font-semibold tracking-normal">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </span>
    </button>
  );
}
