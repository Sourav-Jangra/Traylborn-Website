import type { DepartureRule, TravelPackage } from "@/lib/types";
import { formatDate, parseISODate, toISODate } from "./format";

export const MAX_PARTICIPANTS = 25;

export interface Departure {
  date: string;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function todayISO() {
  return toISODate(new Date());
}

export function isDateAllowed(rule: DepartureRule, iso: string, fromISO = todayISO()) {
  if (iso < fromISO) return false;
  switch (rule.type) {
    case "fixed":
      return rule.dates.includes(iso);
    case "daily":
      return iso >= rule.startDate && iso <= rule.endDate && !rule.blackoutDates?.includes(iso);
    case "weekly":
      return (
        iso >= rule.startDate &&
        iso <= rule.endDate &&
        rule.weekdays.includes(parseISODate(iso).getDay())
      );
  }
}

export function getDepartures(pkg: Pick<TravelPackage, "departureRule">, limit = 120, fromISO = todayISO()): Departure[] {
  const rule = pkg.departureRule;
  if (rule.type === "fixed") {
    return rule.dates
      .filter((d) => d >= fromISO)
      .slice(0, limit)
      .map((date) => ({ date }));
  }

  const out: Departure[] = [];
  const start = parseISODate(rule.startDate > fromISO ? rule.startDate : fromISO);
  const end = parseISODate(rule.endDate);
  for (const d = start; d <= end && out.length < limit; d.setDate(d.getDate() + 1)) {
    const iso = toISODate(d);
    if (isDateAllowed(rule, iso, fromISO)) out.push({ date: iso });
  }
  return out;
}

export function getNextDeparture(pkg: TravelPackage, fromISO = todayISO()) {
  return getDepartures(pkg, 1, fromISO)[0];
}

function listOf(items: string[]) {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} & ${items.at(-1)}` : items[0];
}

function dateRange(first: string, last: string) {
  if (first === last) return formatDate(first);
  const sameYear = first.slice(0, 4) === last.slice(0, 4);
  return `${formatDate(first, sameYear ? { year: undefined } : {})} – ${formatDate(last)}`;
}

/**
 * Customer-facing summary of a departure rule, built from the dates the rule
 * actually produces from `fromISO` onwards so it can never contradict the calendar.
 */
export function describeDepartures(rule: DepartureRule, fromISO = todayISO()) {
  const dates = getDepartures({ departureRule: rule }, Infinity, fromISO).map((d) => d.date);
  if (dates.length === 0) return "New departures announced soon";
  const first = dates[0];
  const last = dates.at(-1)!;
  if (dates.length === 1) return `One departure · ${formatDate(first)}`;
  const range = dateRange(first, last);

  switch (rule.type) {
    case "fixed":
      return `${dates.length} fixed departures · ${range}`;
    case "weekly": {
      const days = [...new Set(rule.weekdays)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
      if (days.length < 7) {
        const names = days.length > 2 ? days.map((d) => WEEKDAYS[d].slice(0, 3)) : days.map((d) => WEEKDAYS[d]);
        return `Every ${listOf(names)} · ${range}`;
      }
      return `Daily · ${range}`;
    }
    case "daily": {
      const blocked = (rule.blackoutDates ?? []).filter((d) => d > first && d < last).sort();
      const except =
        blocked.length === 0
          ? ""
          : blocked.length > 2
            ? `, except ${blocked.length} dates`
            : `, except ${listOf(blocked.map((d) => formatDate(d, { year: undefined })))}`;
      return `Daily · ${range}${except}`;
    }
  }
}
