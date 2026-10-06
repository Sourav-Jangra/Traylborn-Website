import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 92" aria-hidden="true" className={cn("h-7 w-auto", className)}>
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M50 2 L98 92 L55 92 L58.5 72 L52 60 L60.5 45 L53.5 45 L45.5 58.5 L51 70.5 L43 92 L2 92 Z"
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  tone?: "light" | "dark";
  showTagline?: boolean;
}

export function Logo({ className, tone = "dark", showTagline = false }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Traylborn home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-md",
        tone === "light" ? "text-white" : "text-pine-800",
        className,
      )}
    >
      <LogoMark className="h-7 transition-transform duration-500 group-hover:-translate-y-0.5" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.2rem] font-extrabold tracking-[0.08em]">TRAYLBORN</span>
        {showTagline && (
          <span className={cn("mt-1 text-[0.6rem] font-medium tracking-[0.18em] uppercase", tone === "light" ? "text-white/70" : "text-pine-700/70")}>
            Born of trails
          </span>
        )}
      </span>
    </Link>
  );
}
