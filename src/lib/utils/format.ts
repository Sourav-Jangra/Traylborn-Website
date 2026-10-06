const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return inr.format(Math.round(amount));
}

export function formatDuration(days: number, nights: number) {
  return `${days} Days / ${nights} Nights`;
}

export function formatShortDuration(days: number, nights: number) {
  return `${days}D / ${nights}N`;
}

/**
 * Calendar dates ("YYYY-MM-DD") are handled as UTC midnight and read back with UTC
 * getters, so a date never shifts with the timezone of the server or the browser.
 */
export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  return parseISODate(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
    timeZone: "UTC",
  });
}

export function formatDateLong(iso: string) {
  return parseISODate(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function addDays(iso: string, days: number) {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

/** Business timezone. "Today" for departures and bookings is always India's date. */
export const BUSINESS_TIME_ZONE = "Asia/Kolkata";

const businessDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in India as "YYYY-MM-DD", whatever the machine's timezone. */
export function todayISO(now = new Date()) {
  return businessDate.format(now);
}

/** The next `count` calendar months starting from the current month in India. */
export function upcomingCalendarMonths(count: number, monthStyle: "short" | "long") {
  const [y, m] = todayISO().split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 + i, 1));
    return {
      value: toISODate(d).slice(0, 7),
      label: d.toLocaleDateString("en-IN", { month: monthStyle, year: "numeric", timeZone: "UTC" }),
    };
  });
}
