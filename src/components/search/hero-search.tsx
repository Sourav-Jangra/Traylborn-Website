"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CalendarDays, ChevronDown, Compass, MapPin, Search } from "lucide-react";
import { categories } from "@/lib/config/categories";
import { upcomingCalendarMonths } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const destinations = ["Manali", "Kasol", "Chopta", "Sankri", "Spiti", "Ladakh", "Kinnaur", "Rishikesh", "McLeodganj"];

function upcomingMonths(count = 8) {
  return upcomingCalendarMonths(count, "long");
}

export function HeroSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("all");
  const [month, setMonth] = useState("");
  const months = upcomingMonths();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("q", destination);
    if (category !== "all") params.set("category", category);
    if (month) params.set("month", month);
    router.push(`/search${params.size ? `?${params}` : ""}`);
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Find a journey"
      className={cn(
        "grid grid-cols-1 gap-1 rounded-[1.75rem] bg-white p-2 shadow-2xl shadow-black/25 md:grid-cols-[1.2fr_1fr_1fr_auto] md:rounded-full",
        className,
      )}
    >
      <Field icon={<MapPin className="size-4" />} label="Destination">
        <select value={destination} onChange={(e) => setDestination(e.target.value)} className={selectClass} aria-label="Destination">
          <option value="">Anywhere in the Himalaya</option>
          {destinations.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </Field>
      <Field icon={<Compass className="size-4" />} label="Experience" divider>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass} aria-label="Experience type">
          <option value="all">All experiences</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      </Field>
      <Field icon={<CalendarDays className="size-4" />} label="Departure" divider>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectClass} aria-label="Departure month">
          <option value="">Any month</option>
          {months.map((mo) => (
            <option key={mo.value} value={mo.value}>{mo.label}</option>
          ))}
        </select>
      </Field>
      <button
        type="submit"
        className="mt-1 flex h-14 items-center justify-center gap-2 rounded-full bg-pine-800 px-7 font-semibold text-white transition-colors hover:bg-pine-700 md:mt-0 md:h-auto"
      >
        <Search className="size-4" />
        Search
      </button>
    </form>
  );
}

const selectClass =
  "w-full cursor-pointer appearance-none bg-transparent pr-6 text-[0.95rem] font-medium text-ink outline-none";

function Field({
  icon,
  label,
  divider,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col justify-center rounded-2xl px-5 py-2.5 transition-colors hover:bg-sand-100 focus-within:bg-sand-100 md:rounded-full",
        divider && "md:before:absolute md:before:top-1/4 md:before:left-0 md:before:h-1/2 md:before:w-px md:before:bg-border",
      )}
    >
      <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-wider text-pine-600 uppercase">
        {icon}
        {label}
      </span>
      {children}
      <ChevronDown className="pointer-events-none absolute right-5 bottom-3.5 size-4 text-muted-foreground" aria-hidden="true" />
    </label>
  );
}
