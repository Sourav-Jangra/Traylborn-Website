import { Check } from "lucide-react";
import { STEPS } from "./types";
import { cn } from "@/lib/utils";

export function Stepper({ step, onStepClick }: { step: number; onStepClick: (i: number) => void }) {
  return (
    <nav aria-label="Checkout progress">
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => done && onStepClick(i)}
                disabled={!done}
                aria-current={current ? "step" : undefined}
                className="flex items-center gap-2 disabled:cursor-default"
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors",
                    done && "bg-pine-800 text-white",
                    current && "bg-ember-500 text-ink ring-4 ring-ember-500/20",
                    !done && !current && "bg-white text-muted-foreground ring-1 ring-border",
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                <span className={cn("hidden text-sm font-medium sm:inline", current ? "text-ink" : "text-muted-foreground")}>
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span className={cn("h-0.5 flex-1 rounded-full", done ? "bg-pine-800" : "bg-border")} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-medium text-ink sm:hidden">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>
    </nav>
  );
}
