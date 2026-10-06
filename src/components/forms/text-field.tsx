import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  icon?: ReactNode;
}

export function TextField({ label, error, hint, icon, className, id, required, ...props }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-ember-600"> *</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-xl border bg-white px-4 text-[0.95rem] text-ink outline-none transition-shadow placeholder:text-muted-foreground/70 focus:ring-4",
            icon && "pl-11",
            error ? "border-destructive focus:ring-destructive/10" : "border-border focus:border-pine-600 focus:ring-pine-600/10",
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
